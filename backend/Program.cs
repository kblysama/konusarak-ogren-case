using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// --------- CONFIG & DB PATH ---------
var connectionString = builder.Configuration.GetConnectionString("ChatDb") ?? "Data Source=chat.db";
DbInit.EnsureDatabaseDirectory(connectionString, builder.Environment.ContentRootPath);

// --------- SERVICES ---------
builder.Services.AddDbContext<ChatDb>(opt => opt.UseSqlite(connectionString));
builder.Services.AddHttpClient();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// CORS (Config: "Cors:AllowedOrigins": ["https://...","http://..."])
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

// --------- MIDDLEWARES ---------
app.UseCors("Frontend");
app.UseSwagger();
app.UseSwaggerUI();

// Ensure DB & Migrate
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ChatDb>();
    db.Database.Migrate();
}

// --------- ENDPOINTS ---------
app.MapGet("/health", () => Results.Ok(new { status = "healthy" }));

app.MapPost("/register", async (ChatDb db, User user) =>
{
    if (string.IsNullOrWhiteSpace(user.Nickname))
        return Results.BadRequest("nickname required");

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

// NOTE: Gradio REST API kullanıyoruz (SDK Gradio).
// Gradio default endpoint: POST {AI_URL}/api/predict/
// Body: { "data": ["metin"] }
// Response: { "data": [ { "sentiment": "...", "score": 0.xx } ], ... }
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

    var aiBase = cfg["AI_URL"] ?? "";
    if (string.IsNullOrWhiteSpace(aiBase)) return Results.Problem("AI_URL not configured");

    var client = httpFactory.CreateClient();
    client.Timeout = TimeSpan.FromSeconds(45);

    var endpoint = $"{aiBase.TrimEnd('/')}/api/predict/";
    HttpResponseMessage? res;

    try
    {
        var bodyObj = new { data = new object[] { payload.Text } };
        res = await client.PostAsJsonAsync(endpoint, bodyObj);
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "AI service unreachable at {Endpoint}", endpoint);
        return Results.Problem("ai-service unreachable");
    }

    var raw = await res.Content.ReadAsStringAsync();

    if (!res.IsSuccessStatusCode)
    {
        logger.LogError("AI service returned {Status}: {Body}", res.StatusCode, raw);
        return Results.Problem($"ai-service error ({(int)res.StatusCode})");
    }

    // Parse Gradio response
    string sentiment = "neutral";
    double score = 0.0;

    try
    {
        using var doc = JsonDocument.Parse(raw);
        var root = doc.RootElement;
        if (root.TryGetProperty("data", out var dataArr) && dataArr.GetArrayLength() > 0)
        {
            var first = dataArr[0];
            if (first.ValueKind == JsonValueKind.Object)
            {
                if (first.TryGetProperty("sentiment", out var s)) sentiment = s.GetString() ?? "neutral";
                if (first.TryGetProperty("score", out var sc)) score = sc.GetDouble();
            }
            else if (first.ValueKind == JsonValueKind.String)
            {
                // Bazı gradio örnekleri sadece string döndürebilir
                sentiment = first.GetString() ?? "neutral";
            }
        }
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "AI response parse error. Raw: {Raw}", raw);
        return Results.Problem("ai-service error");
    }

    var message = new Message
    {
        UserId = user.Id,
        Nickname = user.Nickname,
        Text = payload.Text,
        Sentiment = sentiment,
        Score = score,
        CreatedAt = DateTime.UtcNow
    };

    db.Messages.Add(message);
    await db.SaveChangesAsync();
    return Results.Ok(message);
});

app.Run();

// --------- TYPES (Top-level KODDAN SONRA) ---------
public record MessageIn(string Nickname, string Text);

// (FastAPI kullansaydın bu response'u kullanırdık. Gradio için yukarıda JSON parse yapıyoruz)
public record AnalysisResponse(
    [property: JsonPropertyName("sentiment")] string Sentiment,
    [property: JsonPropertyName("score")] double Score);

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

// ------- STATIC HELPER (Artık type member; CS8803’i tetiklemez) -------
public static class DbInit
{
    public static void EnsureDatabaseDirectory(string connectionString, string contentRoot)
    {
        var builder = new SqliteConnectionStringBuilder(connectionString);
        var dataSource = builder.DataSource;

        if (string.IsNullOrWhiteSpace(dataSource)) return;

        var fullPath = Path.IsPathRooted(dataSource)
            ? dataSource
            : Path.Combine(contentRoot, dataSource);

        var directory = Path.GetDirectoryName(fullPath);
        if (!string.IsNullOrEmpty(directory))
        {
            Directory.CreateDirectory(directory);
        }
    }
}
