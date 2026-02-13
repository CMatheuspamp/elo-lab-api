using EloLab.API.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

// ==============================================================================
// 1. CONFIGURAÇÃO DE AMBIENTE E BANCO DE DADOS (CRÍTICO PARA O RENDER)
// ==============================================================================

// Tenta pegar a conexão do arquivo local ou da variável de ambiente do Render
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
                       ?? Environment.GetEnvironmentVariable("DB_CONNECTION_STRING");

if (string.IsNullOrEmpty(connectionString))
{
    throw new Exception("ERRO FATAL: String de conexão com o banco não encontrada.");
}

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

// ==============================================================================
// 2. CONFIGURAÇÃO DE CORS (PARA O FRONTEND ACESSAR)
// ==============================================================================
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// ==============================================================================
// 3. CONFIGURAÇÃO DE AUTENTICAÇÃO (JWT)
// ==============================================================================
// Usa a chave do appsettings ou uma variável de ambiente, com fallback para dev
var jwtKey = builder.Configuration["Jwt:Key"] 
             ?? Environment.GetEnvironmentVariable("JWT_KEY") 
             ?? "chave_secreta_padrao_para_desenvolvimento_apenas";

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
        ValidateIssuer = false, // Simplificado para evitar erros de domínio
        ValidateAudience = false
    };
});

// 4. Configuração dos Controllers (JSON)
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

// 5. Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "EloLab API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Insira o token assim: Bearer SEU_TOKEN"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" } },
            new string[] {}
        }
    });
});

var app = builder.Build();

// ==============================================================================
// 6. AUTO-MIGRATION (CRÍTICO: CRIA O BANCO SOZINHO NO RENDER)
// ==============================================================================
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    try 
    {
        Console.WriteLine("A aplicar migrações do banco de dados...");
        dbContext.Database.Migrate(); 
        Console.WriteLine("Banco de dados atualizado com sucesso!");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"ERRO AO APLICAR MIGRATIONS: {ex.Message}");
    }
}

// Configurações do Pipeline
app.UseSwagger();
app.UseSwaggerUI();

// Removemos HttpsRedirection no Render pois ele gere o SSL externamente e pode causar loops
// app.UseHttpsRedirection(); 

app.UseCors("AllowAll");

// 7. Arquivos Estáticos (Uploads e 3D)
var provider = new FileExtensionContentTypeProvider();
provider.Mappings[".stl"] = "application/vnd.ms-pki.stl";
provider.Mappings[".obj"] = "model/obj";

var caminhoWwwRoot = Path.Combine(app.Environment.ContentRootPath, "wwwroot");
if (!Directory.Exists(caminhoWwwRoot)) Directory.CreateDirectory(caminhoWwwRoot);

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(caminhoWwwRoot),
    ContentTypeProvider = provider,
    OnPrepareResponse = ctx =>
    {
        ctx.Context.Response.Headers.Append("Access-Control-Allow-Origin", "*");
    }
});

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// ==============================================================================
// 8. CONFIGURAÇÃO DE PORTA (OBRIGATÓRIO PARA O RENDER)
// ==============================================================================
var port = Environment.GetEnvironmentVariable("PORT") ?? "8080";
app.Run($"http://0.0.0.0:{port}");