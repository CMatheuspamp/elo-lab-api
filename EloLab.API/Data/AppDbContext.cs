using EloLab.API.Models;
using Microsoft.EntityFrameworkCore;

namespace EloLab.API.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }
    
    // Listar tabelas que queremos acessar
    public DbSet<Laboratorio> Laboratorios { get; set; }
    public DbSet<Clinica> Clinicas { get; set; }
    public DbSet<LaboratorioClinica> LaboratorioClinicas { get; set; }
    public DbSet<Servico> Servicos { get; set; }
    public DbSet<Trabalho> Trabalhos { get; set; }
    public DbSet<Mensagem> Mensagens { get; set; }
    public DbSet<Anexo> Anexos { get; set; }
}