using EloLab.API.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.StaticFiles; // Necessário para FileExtensionContentTypeProvider
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders; // Necessário para PhysicalFileProvider
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Supabase;

var builder = WebApplication.CreateBuilder(args);

// =========================================================
// 1. CONFIGURAÇÃO DO BANCO DE DADOS
// =========================================================
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

// =========================================================
// 2. CONFIGURAÇÃO DO SUPABASE
// =========================================================
var supabaseUrl = builder.Configuration["SupabaseSettings:Url"] ?? throw new Exception("Url ausente");
var supabaseKey = builder.Configuration["SupabaseSettings:Key"] ?? throw new Exception("Key ausente");

var options = new SupabaseOptions
{
    AutoRefreshToken = true,
    AutoConnectRealtime = false
};

builder.Services.AddScoped<Supabase.Client>(_ => 
    new Supabase.Client(supabaseUrl, supabaseKey, options));

// =========================================================
// 3. CONFIGURAÇÃO DA AUTENTICAÇÃO
// =========================================================
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.Authority = $"{supabaseUrl}/auth/v1";
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidIssuer = $"{supabaseUrl}/auth/v1",
        ValidateAudience = true,
        ValidAudience = "authenticated",
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});

// =========================================================
// 4. CONFIGURAÇÃO DO SWAGGER
// =========================================================
builder.Services.AddControllers();
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
        Description = "Insira o token JWT desta forma: Bearer SEU_TOKEN_AQUI"
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

// =========================================================
// 5. CONFIGURAÇÃO DE CORS
// =========================================================
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

// =========================================================
// 6. PIPELINE DE EXECUÇÃO
// =========================================================

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// CORS DEVE VIR AQUI
app.UseCors("PermitirFrontend");

// =========================================================
// 7. CONFIGURAÇÃO BLINDADA DE ARQUIVOS ESTÁTICOS
// =========================================================

// A. Definir tipos MIME para STL e OBJ (Senão dá 404)
var provider = new FileExtensionContentTypeProvider();
provider.Mappings[".stl"] = "application/vnd.ms-pki.stl";
provider.Mappings[".obj"] = "model/obj";

// B. Encontrar o caminho absoluto da pasta wwwroot
// Isso resolve o problema de rodar em pastas diferentes
var caminhoWwwRoot = Path.Combine(builder.Environment.ContentRootPath, "wwwroot");

// Garantir que a pasta existe para não dar erro na inicialização
if (!Directory.Exists(caminhoWwwRoot))
{
    Directory.CreateDirectory(caminhoWwwRoot);
}

app.UseStaticFiles(new StaticFileOptions
{
    // Força o servidor a olhar para a pasta física correta
    FileProvider = new PhysicalFileProvider(caminhoWwwRoot),
    
    // Aplica os tipos MIME novos
    ContentTypeProvider = provider,
    
    // Adiciona Headers CORS extra na resposta do arquivo
    OnPrepareResponse = ctx =>
    {
        ctx.Context.Response.Headers.Append("Access-Control-Allow-Origin", "*");
        ctx.Context.Response.Headers.Append("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    }
});
// =========================================================

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();