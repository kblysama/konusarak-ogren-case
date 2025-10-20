using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<ChatDb>(opt =>
    opt.UseSqlite(builder.Configuration.GetConnectionString("ChatDb") ?? "Data Source=chat.db"));
builder.Services.AddHttpClient();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// CORS desteği ekle
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", builder =>
    {
        builder.AllowAnyOrigin()
               .AllowAnyMethod()
               .AllowAnyHeader();
    });
});

var app = builder.Build();

// CORS kullan
app.UseCors("AllowAll");

// Ensure DB
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ChatDb>();
    db.Database.EnsureCreated();
}

app.UseSwagger();
app.UseSwaggerUI();

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



app.MapPost("/message", async (ChatDb db, IHttpClientFactory httpFactory, MessageIn payload, IConfiguration cfg) =>
{
    if (string.IsNullOrWhiteSpace(payload.Nickname) || string.IsNullOrWhiteSpace(payload.Text))
        return Results.BadRequest("nickname and text required");

    var user = await db.Users.FirstOrDefaultAsync(u => u.Nickname == payload.Nickname);
    if (user is null) return Results.NotFound("user not found");

    var aiUrl = cfg["AI_URL"] ?? "";
    if (string.IsNullOrWhiteSpace(aiUrl)) return Results.Problem("AI_URL not configured");

    var client = httpFactory.CreateClient();
    var res = await client.PostAsJsonAsync($"{aiUrl.TrimEnd('/')}", new { data = new[] { payload.Text } });
    if (!res.IsSuccessStatusCode) return Results.Problem("ai-service error");
    var aiResponse = await res.Content.ReadFromJsonAsync<GradioResponse>();
    var ai = new AIResult { 
        sentiment = aiResponse?.data?[0]?.sentiment ?? "neutral", 
        score = aiResponse?.data?[0]?.score ?? 0.5 
    };

    var message = new Message
    {
        UserId = user.Id,
        Nickname = user.Nickname,
        Text = payload.Text,
        Sentiment = ai.sentiment,
        Score = ai.score,
        CreatedAt = DateTime.UtcNow
    };
    db.Messages.Add(message);
    await db.SaveChangesAsync();
    return Results.Ok(message);
});

app.Run();

public record MessageIn(string Nickname, string Text);
public record AIResult { public string sentiment {get;set;} = "neutral"; public double score {get;set;} = 0; }
public record GradioResponse { public GradioData[]? data {get;set;} }
public record GradioData { public string sentiment {get;set;} = "neutral"; public double score {get;set;} = 0; }

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
}
