using EloLab.API.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
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
// 2. CONFIGURAÇÃO DO SUPABASE (CLIENTE)
// =========================================================
var supabaseUrl = builder.Configuration["SupabaseSettings:Url"] ?? throw new Exception("Url ausente");
var supabaseKey = builder.Configuration["SupabaseSettings:Key"] ?? throw new Exception("Key ausente");
// O JwtSecret AINDA é necessário para o Cliente Supabase assinar as coisas dele,
// mas NÃO será usado para validar o Token de entrada da API.
var jwtSecret = builder.Configuration["SupabaseSettings:JwtSecret"]; 

var options = new SupabaseOptions
{
    AutoRefreshToken = true,
    AutoConnectRealtime = false
};

builder.Services.AddScoped<Supabase.Client>(_ => 
    new Supabase.Client(supabaseUrl, supabaseKey, options));

// =========================================================
// 3. CONFIGURAÇÃO DA AUTENTICAÇÃO (CORRIGIDA PARA ES256)
// =========================================================
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    // A MÁGICA ACONTECE AQUI:
    // Dizemos ao .NET: "A autoridade é o Supabase. Vai lá buscar as chaves públicas sozinho."
    options.Authority = $"{supabaseUrl}/auth/v1";
    
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidIssuer = $"{supabaseUrl}/auth/v1", // O emissor deve ser exatamente este URL
        
        ValidateAudience = true,
        ValidAudience = "authenticated", // O Supabase coloca "authenticated" como público alvo
        
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
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] {}
        }
    });
});

// 1. ADICIONAR O SERVIÇO DE CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("PermitirFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173") // <--- A URL do seu React
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

// =========================================================
// 5. PIPELINE
// =========================================================
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// 2. ATIVAR O CORS (Coloque exatamente aqui)
app.UseCors("PermitirFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();