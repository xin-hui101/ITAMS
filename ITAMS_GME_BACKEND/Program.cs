using System.Text; // For encoding the secret key when generating JWT tokens
using Microsoft.AspNetCore.Authentication.JwtBearer; // For JWT Bearer authentication
using Microsoft.EntityFrameworkCore; // For EF Core database context
using Microsoft.IdentityModel.Tokens; // For defining security keys and signing credentials when generating JWT tokens
using ITAMS_GME_BACKEND.Data;
using ITAMS_GME_BACKEND.Services;

// Step 1: Create the app builder
var builder = WebApplication.CreateBuilder(args);

// Step 2: Register Database
// - Tell EF Core to use MSSQL with the connection string from appsettings.json
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"))
);

// Step 3: Read JWT settings from appsettings.json
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"]!;

// Step 4: Register JWT Authentication
// - Tell ASP.NET Core to use JWT Bearer tokens for authentication
// - Validate token on every protected request
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,       // Check token issuer
        ValidateAudience = true,       // Check token audience
        ValidateLifetime = true,       // Check token expiry
        ValidateIssuerSigningKey = true,       // Check token signature
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
        ClockSkew = TimeSpan.Zero  // No grace period after token expires
    };
});

builder.Services.AddAuthorization();

// Step 5: Register CORS
// - Allow React frontend (Vite default port 5173) to call this API
builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactApp", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Step 6: Register Services
// - AddScoped means one AuthService instance per HTTP request
builder.Services.AddScoped<AuditLogService>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<CategoryService>();
builder.Services.AddScoped<AssetService>();
builder.Services.AddScoped<MaintenanceService>();
builder.Services.AddScoped<DashboardService>();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Step 7: Build the app
var app = builder.Build();

// Step 8: Set up middleware pipeline (order matters!)
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Step 9: HTTPS redirect — force all requests to use HTTPS
app.UseHttpsRedirection();

// Step 10: Apply middleware in correct order
// - CORS must come before Authentication
// - Authentication must come before Authorization
app.UseCors("ReactApp");
app.UseAuthentication();
app.UseAuthorization();

// Step 11: Map controllers — tell ASP.NET to use controller routing
app.MapControllers();

// Step 12: Run the app
app.Run();