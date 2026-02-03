using EloLab.API.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens; // Necessário para tokens
using Microsoft.OpenApi.Models;
using Supabase;
using System.Text;
using System.Text.Json.Serialization; // Necessário para evitar ciclos JSON

var builder = WebApplication.CreateBuilder(args);

// 1. Configuração do Banco
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

// 2. Configurações do Supabase
var supabaseUrl = builder.Configuration["SupabaseSettings:Url"];
var supabaseKey = builder.Configuration["SupabaseSettings:Key"];
var jwtSecret = builder.Configuration["SupabaseSettings:JwtSecret"]; // <--- Novo

if (string.IsNullOrEmpty(supabaseUrl) || string.IsNullOrEmpty(jwtSecret))
{
    // Se esquecer o segredo, o app avisa logo no início
    throw new Exception("ATENÇÃO: 'JwtSecret' ou 'Url' ausentes no appsettings.json");
}

var options = new SupabaseOptions
{
    AutoRefreshToken = true,
    AutoConnectRealtime = false
};

builder.Services.AddScoped<Supabase.Client>(_ => 
    new Supabase.Client(supabaseUrl, supabaseKey, options));

// 3. CONFIGURAÇÃO DA AUTENTICAÇÃO (TOKEN INTELIGENTE)
var bytesKey = Encoding.UTF8.GetBytes(jwtSecret);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(bytesKey),
        
        ValidateIssuer = true,
        ValidIssuer = $"{supabaseUrl}/auth/v1",
        
        ValidateAudience = true,
        ValidAudience = "authenticated",
        
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});

// 4. Controllers com prevenção de Ciclo Infinito (Erro 500)
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    });

// 5. Swagger e Documentação
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
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            new string[] {}
        }
    });
});

// 6. CORS (Permitir Frontend)
builder.Services.AddCors(options =>
{
    options.AddPolicy("PermitirFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("PermitirFrontend");

// 7. Arquivos Estáticos (3D e Imagens)
var provider = new FileExtensionContentTypeProvider();
provider.Mappings[".stl"] = "application/vnd.ms-pki.stl";
provider.Mappings[".obj"] = "model/obj";

var caminhoWwwRoot = Path.Combine(builder.Environment.ContentRootPath, "wwwroot");
if (!Directory.Exists(caminhoWwwRoot)) Directory.CreateDirectory(caminhoWwwRoot);

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(caminhoWwwRoot),
    ContentTypeProvider = provider,
    OnPrepareResponse = ctx =>
    {
        ctx.Context.Response.Headers.Append("Access-Control-Allow-Origin", "*");
        ctx.Context.Response.Headers.Append("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    }
});

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();