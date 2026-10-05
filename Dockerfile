FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["backend/ApartmentManagement.Api/ApartmentManagement.Api.csproj", "backend/ApartmentManagement.Api/"]
RUN dotnet restore "backend/ApartmentManagement.Api/ApartmentManagement.Api.csproj"

COPY . .
WORKDIR "/src/backend/ApartmentManagement.Api"
RUN dotnet publish "ApartmentManagement.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "ApartmentManagement.Api.dll"]
