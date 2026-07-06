namespace ITAMS_GME_BACKEND.DTOs
{
    public class ChatRequestDto
    {
        public string Message { get; set; } = string.Empty;
    }

    public class ChatResponseDto
    {
        public string Reply { get; set; } = string.Empty;
    }
}