# Estágio de Build (Usando .NET 9 SDK)
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /app

# Copia tudo da raiz do projeto para dentro da imagem
COPY . ./

# Tenta restaurar
RUN dotnet restore "./EloLab.API/EloLab.API.csproj"

# Compila e Publica
RUN dotnet publish "./EloLab.API/EloLab.API.csproj" -c Release -o /app/out

# Estágio Final (Usando .NET 9 Runtime)
FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
COPY --from=build /app/out .

ENV ASPNETCORE_URLS=http://+:8080
# Cria pasta de uploads para garantir
RUN mkdir -p wwwroot/uploads

EXPOSE 8080

ENTRYPOINT ["dotnet", "EloLab.API.dll"]