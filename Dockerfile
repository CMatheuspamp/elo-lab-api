# Estágio de Build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

# Copia tudo da raiz do projeto para dentro da imagem
COPY . ./

# DEBUG: Lista os arquivos para vermos onde o .csproj realmente está nos logs se der erro de novo
RUN ls -R

# Tenta restaurar (Removi o 'src/' do caminho, pois é provável que esteja na raiz ou apenas em EloLab.API)
# Se a pasta se chamar 'elolab.api' (minúsculo), o Linux vai achar na listagem acima
RUN dotnet restore "./EloLab.API/EloLab.API.csproj"

# Compila e Publica
RUN dotnet publish "./EloLab.API/EloLab.API.csproj" -c Release -o /app/out

# Estágio Final
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app/out .

ENV ASPNETCORE_URLS=http://+:8080
# Cria pasta de uploads para garantir
RUN mkdir -p wwwroot/uploads

EXPOSE 8080

ENTRYPOINT ["dotnet", "EloLab.API.dll"]