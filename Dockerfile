# Estágio de Build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

# Copia tudo para dentro da imagem
COPY . ./

# Restaura dependências
RUN dotnet restore "./src/EloLab.API/EloLab.API.csproj"

# Compila e Publica (Release)
RUN dotnet publish "./src/EloLab.API/EloLab.API.csproj" -c Release -o /app/out

# Estágio Final (Execução)
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app/out .

# Configurações de Ambiente para o Render
ENV ASPNETCORE_URLS=http://+:8080
# Garante que as pastas de upload existam
RUN mkdir -p wwwroot/uploads

EXPOSE 8080

ENTRYPOINT ["dotnet", "EloLab.API.dll"]