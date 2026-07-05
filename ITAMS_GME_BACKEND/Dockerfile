# Stage 1 — Build
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /app

# Copy project file and restore dependencies
COPY *.csproj ./
RUN dotnet restore

# Copy everything else and build
COPY . ./
RUN dotnet publish -c Release -o out

# Stage 2 — Runtime
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

# Copy built output from build stage
COPY --from=build /app/out .

# Azure uses PORT environment variable
# Default to 8080 if not set
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

# Production environment
ENV ASPNETCORE_ENVIRONMENT=Production

# Run the app
ENTRYPOINT ["dotnet", "ITAMS_GME_BACKEND.dll"]