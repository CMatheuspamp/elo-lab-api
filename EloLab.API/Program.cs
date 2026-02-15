using EloLab.API.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Supabase; 
using System.Text;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

// ==============================================================================
// 1. CONFIGURAÇÃO DO BANCO DE DADOS (PostgreSQL)
// ==============================================================================
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
                       ?? Environment.GetEnvironmentVariable("DB_CONNECTION_STRING");

if (string.IsNullOrEmpty(connectionString))
{
    throw new Exception("String de conexão não encontrada. Configure DB_CONNECTION_STRING.");
}

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

// ==============================================================================
// 2. CONFIGURAÇÃO DO SUPABASE CLIENT (SDK)
// ==============================================================================
var supabaseUrl = Environment.GetEnvironmentVariable("SUPABASE_URL") 
                  ?? builder.Configuration["SupabaseSettings:Url"];

var supabaseKey = Environment.GetEnvironmentVariable("SUPABASE_KEY") 
                  ?? builder.Configuration["SupabaseSettings:Key"];

if (string.IsNullOrEmpty(supabaseUrl) || string.IsNullOrEmpty(supabaseKey))
{
    Console.WriteLine("AVISO: Configurações do Supabase (URL/Key) não encontradas!");
}
else 
{
    var options = new SupabaseOptions
    {
        AutoRefreshToken = true,
        AutoConnectRealtime = false
    };

    builder.Services.AddScoped<Supabase.Client>(_ => 
        new Supabase.Client(supabaseUrl, supabaseKey, options));
}

// ==============================================================================
// 3. AUTENTICAÇÃO E JWT
// ==============================================================================
var jwtKey = Environment.GetEnvironmentVariable("JWT_KEY") 
             ?? builder.Configuration["Jwt:Key"]
             ?? builder.Configuration["SupabaseSettings:JwtSecret"] 
             ?? "chave_secreta_fallback_apenas_para_dev";

var key = Encoding.ASCII.GetBytes(jwtKey);

builder.Services.AddAuthentication(x =>
{
    x.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    x.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(x =>
{
    x.RequireHttpsMetadata = false;
    x.SaveToken = true;
    x.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = false,
        ValidateAudience = false
    };
});

// ==============================================================================
// 4. CORS (BLINDAGEM DE PRODUÇÃO)
// ==============================================================================
builder.Services.AddCors(options =>
{
    options.AddPolicy("ProducaoSegura", policy =>
    {
        // Só permite pedidos do site oficial e do teu PC local
        policy.WithOrigins(
            "https://elolabsystems.com", 
            "https://www.elolabsystems.com", 
            "http://localhost:5173"
        )
        .AllowAnyMethod()
        .AllowAnyHeader();
    });
});

// 5. Controllers e JSON
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

// 6. Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "EloLab API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization", Type = SecuritySchemeType.ApiKey, Scheme = "Bearer", BearerFormat = "JWT", In = ParameterLocation.Header, Description = "JWT Authorization header using the Bearer scheme."
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        { new OpenApiSecurityScheme { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" } }, new string[] {} }
    });
});

var app = builder.Build();

// ==============================================================================
// 7. AUTO-MIGRATION
// ==============================================================================
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    try { dbContext.Database.Migrate(); } catch { }
}

app.UseSwagger();
app.UseSwaggerUI();

// APLICA A REGRA DE SEGURANÇA QUE CRIÁMOS ACIMA
app.UseCors("ProducaoSegura");

// ==============================================================================
// 8. ARQUIVOS ESTÁTICOS (UPLOADS E STL)
// ==============================================================================
var provider = new FileExtensionContentTypeProvider();
provider.Mappings[".stl"] = "application/octet-stream"; 
provider.Mappings[".obj"] = "application/octet-stream"; 

var caminhoWwwRoot = Path.Combine(app.Environment.ContentRootPath, "wwwroot");
if (!Directory.Exists(caminhoWwwRoot)) Directory.CreateDirectory(caminhoWwwRoot);
app.UseStaticFiles(new StaticFileOptions 
{ 
    FileProvider = new PhysicalFileProvider(caminhoWwwRoot), 
    ContentTypeProvider = provider 
});

var caminhoUploads = Path.Combine(app.Environment.ContentRootPath, "uploads");
if (!Directory.Exists(caminhoUploads)) Directory.CreateDirectory(caminhoUploads);
app.UseStaticFiles(new StaticFileOptions 
{ 
    FileProvider = new PhysicalFileProvider(caminhoUploads), 
    RequestPath = "/uploads", 
    ContentTypeProvider = provider 
});
// ==============================================================================

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

var port = Environment.GetEnvironmentVariable("PORT") ?? "8080";
app.Run($"http://0.0.0.0:{port}");