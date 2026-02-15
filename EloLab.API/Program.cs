using EloLab.API.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Supabase; // <--- Importante
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
    // Fallback para desenvolvimento local se não achar nada
    throw new Exception("String de conexão não encontrada. Configure DB_CONNECTION_STRING.");
}

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

// ==============================================================================
// 2. CONFIGURAÇÃO DO SUPABASE CLIENT (SDK) - O QUE FALTVAVA
// ==============================================================================
// Tenta pegar do Render (Env Vars) ou do appsettings.json (Local)
var supabaseUrl = Environment.GetEnvironmentVariable("SUPABASE_URL") 
                  ?? builder.Configuration["SupabaseSettings:Url"];

var supabaseKey = Environment.GetEnvironmentVariable("SUPABASE_KEY") 
                  ?? builder.Configuration["SupabaseSettings:Key"];

if (string.IsNullOrEmpty(supabaseUrl) || string.IsNullOrEmpty(supabaseKey))
{
    // Não crashamos aqui para não derrubar o deploy, mas o login vai falhar se isso for nulo
    Console.WriteLine("AVISO: Configurações do Supabase (URL/Key) não encontradas!");
}
else 
{
    var options = new SupabaseOptions
    {
        AutoRefreshToken = true,
        AutoConnectRealtime = false
    };

    // Injeta o Cliente Supabase para o AuthController usar
    builder.Services.AddScoped<Supabase.Client>(_ => 
        new Supabase.Client(supabaseUrl, supabaseKey, options));
}

// ==============================================================================
// 3. AUTENTICAÇÃO E JWT
// ==============================================================================
var jwtKey = Environment.GetEnvironmentVariable("JWT_KEY") 
             ?? builder.Configuration["Jwt:Key"]
             ?? builder.Configuration["SupabaseSettings:JwtSecret"] // Tenta pegar o segredo do Supabase também
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

// 4. CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
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
app.UseCors("AllowAll");

// ==============================================================================
// 8. ARQUIVOS ESTÁTICOS (UPLOADS E STL)
// ==============================================================================
var provider = new FileExtensionContentTypeProvider();
// O formato octet-stream é o mais seguro para garantir que navegadores processam modelos 3D
provider.Mappings[".stl"] = "application/octet-stream"; 
provider.Mappings[".obj"] = "application/octet-stream"; 

// 8.1 Mantém a pasta wwwroot (caso uses no futuro)
var caminhoWwwRoot = Path.Combine(app.Environment.ContentRootPath, "wwwroot");
if (!Directory.Exists(caminhoWwwRoot)) Directory.CreateDirectory(caminhoWwwRoot);
app.UseStaticFiles(new StaticFileOptions 
{ 
    FileProvider = new PhysicalFileProvider(caminhoWwwRoot), 
    ContentTypeProvider = provider 
});

// 8.2 A MÁGICA DOS UPLOADS ACONTECE AQUI:
// Diz ao C# que a pasta física "uploads" responde pela URL "/uploads"
var caminhoUploads = Path.Combine(app.Environment.ContentRootPath, "uploads");
if (!Directory.Exists(caminhoUploads)) Directory.CreateDirectory(caminhoUploads);
app.UseStaticFiles(new StaticFileOptions 
{ 
    FileProvider = new PhysicalFileProvider(caminhoUploads), 
    RequestPath = "/uploads", // <-- Liga a pasta à Rota correta que o React está a pedir!
    ContentTypeProvider = provider 
});
// ==============================================================================

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

var port = Environment.GetEnvironmentVariable("PORT") ?? "8080";
app.Run($"http://0.0.0.0:{port}");