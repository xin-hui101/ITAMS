using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using ITAMS_GME_BACKEND.Data;

namespace ITAMS_GME_BACKEND.Services
{
    public class ChatService
    {
        private readonly AppDbContext _db;
        private readonly IConfiguration _config;
        private readonly HttpClient _http;

        public ChatService(AppDbContext db, IConfiguration config, IHttpClientFactory httpFactory)
        {
            _db = db;
            _config = config;
            _http = httpFactory.CreateClient();
        }

        public async Task<string> AskAsync(string question)
        {
            // Fetch relevant data from DB to give Gemini context
            var totalAssets = await _db.Assets.CountAsync();
            var totalCategories = await _db.Categories.CountAsync();
            var activeAssets = await _db.Assets.CountAsync(a => a.Status == "Active");
            var pendingMaint = await _db.MaintenanceRecords.CountAsync(m => m.Status == "Pending");
            var totalValue = await _db.Assets.SumAsync(a => (decimal?)a.PurchasePrice) ?? 0;

            // Assets expiring within 30 days
            var today = DateTime.UtcNow.Date;
            var alertLimit = today.AddDays(30);
            var warrantyAlerts = await _db.Assets
                .Include(a => a.Category)
                .Where(a => a.WarrantyExpiry.HasValue && a.WarrantyExpiry.Value <= alertLimit)
                .OrderBy(a => a.WarrantyExpiry)
                .Take(10)
                .Select(a => new {
                    a.AssetTag,
                    a.Name,
                    Category = a.Category.Name,
                    WarrantyExpiry = a.WarrantyExpiry!.Value.ToString("dd MMM yyyy"),
                    DaysLeft = (int)(a.WarrantyExpiry!.Value - DateTime.UtcNow).TotalDays
                })
                .ToListAsync();

            // Recent maintenance records
            var recentMaint = await _db.MaintenanceRecords
                .Include(m => m.Asset)
                .OrderByDescending(m => m.CreatedAt)
                .Take(10)
                .Select(m => new {
                    AssetTag = m.Asset.AssetTag,
                    AssetName = m.Asset.Name,
                    m.Type,
                    m.Status,
                    m.Description,
                })
                .ToListAsync();

            // Assets by category
            var byCategory = await _db.Categories
                .Select(c => new {
                    c.Name,
                    Count = c.Assets.Count
                })
                .OrderByDescending(c => c.Count)
                .ToListAsync();

            // Build system context
            var context = $@"
You are an IT Asset Management assistant for ITAMS system.
Answer questions based on the following real-time data:

SUMMARY:
- Total Assets: {totalAssets}
- Total Categories: {totalCategories}
- Active Assets: {activeAssets}
- Pending Maintenance: {pendingMaint}
- Total Asset Value: RM {totalValue:N2}

ASSETS BY CATEGORY:
{JsonSerializer.Serialize(byCategory)}

WARRANTY ALERTS (expiring within 30 days):
{JsonSerializer.Serialize(warrantyAlerts)}

RECENT MAINTENANCE RECORDS:
{JsonSerializer.Serialize(recentMaint)}

Instructions:
- Answer in the same language the user uses
- Be concise and helpful
- If asked about specific assets or details not in the data, say you can only see summary data
- Dates are already formatted for display; present them as-is, do not convert
- Always mention currency as RM when referring to monetary values
- When listing multiple items (assets, warranty alerts, maintenance records), format as a markdown table with clear column headers instead of bullet points
- For a single item, a short sentence followed by a small table is fine
";

            // Call Gemini API
            var apiKey = _config["Gemini:ApiKey"];
            var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key={apiKey}";

            var payload = new
            {
                contents = new[]
                {
                    new
                    {
                        parts = new[]
                        {
                            new { text = context + "\n\nUser question: " + question }
                        }
                    }
                }
            };

            var json = JsonSerializer.Serialize(payload);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _http.PostAsync(url, content);
            var body = await response.Content.ReadAsStringAsync();

            // Debug — log the raw response
            Console.WriteLine($"Gemini response: {body}");

            if (!response.IsSuccessStatusCode)
            {
                return $"AI Service Error ({(int)response.StatusCode}): {body}";
            }

            // Parse Gemini response
            using var doc = JsonDocument.Parse(body);
            var reply = doc.RootElement
                .GetProperty("candidates")[0]
                .GetProperty("content")
                .GetProperty("parts")[0]
                .GetProperty("text")
                .GetString();

            return reply ?? "Sorry, I could not generate a response.";
        }
    }
}