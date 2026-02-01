using EloLab.API.Data;
using Microsoft.EntityFrameworkCore;
using Supabase;

var builder = WebApplication.CreateBuilder(args);

// =========================================================
// 1. CONFIGURAÇÃO DO BANCO DE DADOS (PostgreSQL)
// =========================================================
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

// =========================================================
// 2. CONFIGURAÇÃO DO SUPABASE (Para Upload de Arquivos)
// =========================================================
// Lê as chaves que colocamos no appsettings.json
var supabaseUrl = builder.Configuration["SupabaseSettings:Url"]!;
var supabaseKey = builder.Configuration["SupabaseSettings:Key"]!;

var options = new SupabaseOptions
{
    AutoRefreshToken = true,
    AutoConnectRealtime = false // Não precisamos de Realtime por enquanto
};

// Injeta o Cliente Supabase para que os Controllers possam usá-lo
builder.Services.AddScoped<Supabase.Client>(_ => 
    new Supabase.Client(supabaseUrl, supabaseKey, options));

// =========================================================
// 3. SERVIÇOS PADRÃO DA API
// =========================================================
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// =========================================================
// 4. PIPELINE DE EXECUÇÃO (Middlewares)
// =========================================================
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();