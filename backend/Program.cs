using System.Net.Http.Json;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("ChatDb") ?? "Data Source=chat.db";
EnsureDatabaseDirectory(connectionString, builder.Environment.ContentRootPath);

builder.Services.AddDbContext<ChatDb>(opt =>
    opt.UseSqlite(connectionString));
builder.Services.AddHttpClient();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var allowedOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>()
    ?.Where(o => !string.IsNullOrWhiteSpace(o))
    .Select(o => o.Trim().TrimEnd('/'))
    .ToArray() ?? Array.Empty<string>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        if (allowedOrigins.Length == 0)
        {
            policy.WithOrigins("http://localhost:5173")
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        }
        else
        {
            policy.WithOrigins(allowedOrigins)
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        }
    });
});

var app = builder.Build();

app.UseCors("Frontend");

// Ensure DB
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ChatDb>();
    db.Database.Migrate();
}

app.UseSwagger();
app.UseSwaggerUI();

app.MapGet("/health", () => Results.Ok(new { status = "healthy" }));

app.MapPost("/register", async (ChatDb db, User user) =>
{
    if (string.IsNullOrWhiteSpace(user.Nickname)) return Results.BadRequest("nickname required");
    var exists = await db.Users.AnyAsync(u => u.Nickname == user.Nickname);
    if (exists) return Results.Conflict("nickname already exists");
    user.CreatedAt = DateTime.UtcNow;
    db.Users.Add(user);
    await db.SaveChangesAsync();
    return Results.Ok(new { user.Id, user.Nickname });
});
app.MapGet("/messages", async (ChatDb db) =>
{
    var list = await db.Messages
        .OrderBy(m => m.CreatedAt)
        .AsNoTracking()
        .ToListAsync();
    return Results.Ok(list);
});


app.MapPost("/message", async (
    ChatDb db,
    IHttpClientFactory httpFactory,
    MessageIn payload,
    IConfiguration cfg,
    ILogger<Program> logger) =>
{
    if (string.IsNullOrWhiteSpace(payload.Nickname) || string.IsNullOrWhiteSpace(payload.Text))
        return Results.BadRequest("nickname and text required");

    var user = await db.Users.FirstOrDefaultAsync(u => u.Nickname == payload.Nickname);
    if (user is null) return Results.NotFound("user not found");

    var aiUrl = cfg["AI_URL"] ?? "";
    if (string.IsNullOrWhiteSpace(aiUrl)) return Results.Problem("AI_URL not configured");

    var client = httpFactory.CreateClient();
    var target = $"{aiUrl.TrimEnd('/')}/analyze";

    HttpResponseMessage? res;
    try
    {
        res = await client.PostAsJsonAsync(target, new { message = payload.Text });
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "AI service unreachable at {Target}", target);
        return Results.Problem("ai-service unreachable");
    }

    if (!res.IsSuccessStatusCode)
    {
        var body = await res.Content.ReadAsStringAsync();
        logger.LogError("AI service returned {Status}: {Body}", res.StatusCode, body);
        return Results.Problem("ai-service error");
    }

    var aiResponse = await res.Content.ReadFromJsonAsync<AnalysisResponse>();
    if (aiResponse is null)
    {
        logger.LogError("AI service returned empty body");
        return Results.Problem("ai-service error");
    }

    var message = new Message
    {
        UserId = user.Id,
        Nickname = user.Nickname,
        Text = payload.Text,
        Sentiment = aiResponse.Sentiment,
        Score = aiResponse.Score,
        CreatedAt = DateTime.UtcNow
    };
    db.Messages.Add(message);
    await db.SaveChangesAsync();
    return Results.Ok(message);
});

app.Run();

public record MessageIn(string Nickname, string Text);
public record AnalysisResponse(string Sentiment, double Score);

public class User
{
    public int Id { get; set; }
    public string Nickname { get; set; } = "";
    public DateTime CreatedAt { get; set; }
}

public class Message
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Nickname { get; set; } = "";
    public string Text { get; set; } = "";
    public string Sentiment { get; set; } = "neutral";
    public double Score { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class ChatDb : DbContext
{
    public ChatDb(DbContextOptions<ChatDb> options) : base(options) { }
    public DbSet<User> Users => Set<User>();
    public DbSet<Message> Messages => Set<Message>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Nickname)
            .IsUnique();
    }
}

static void EnsureDatabaseDirectory(string connectionString, string contentRoot)
{
    var builder = new SqliteConnectionStringBuilder(connectionString);
    var dataSource = builder.DataSource;

    if (string.IsNullOrWhiteSpace(dataSource))
    {
        return;
    }

    var fullPath = Path.IsPathRooted(dataSource)
        ? dataSource
        : Path.Combine(contentRoot, dataSource);

    var directory = Path.GetDirectoryName(fullPath);
    if (!string.IsNullOrEmpty(directory))
    {
        Directory.CreateDirectory(directory);
    }
}
