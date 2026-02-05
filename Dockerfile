# Estágio de Build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copia os ficheiros de projeto e restaura as dependências
COPY ["EloLab.API/EloLab.API.csproj", "EloLab.API/"]
RUN dotnet restore "EloLab.API/EloLab.API.csproj"

# Copia todo o código fonte
COPY . .
WORKDIR "/src/EloLab.API"

# Compila a aplicação
RUN dotnet build "EloLab.API.csproj" -c Release -o /app/build

# Publica a aplicação
FROM build AS publish
RUN dotnet publish "EloLab.API.csproj" -c Release -o /app/publish

# Estágio Final (Imagem leve para produção)
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .

# O Render injeta a porta na variável PORT
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "EloLab.API.dll"]