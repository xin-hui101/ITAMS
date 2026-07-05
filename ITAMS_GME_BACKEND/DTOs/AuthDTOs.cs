//DTOs = Data Transfer Objects, 定义 API 接收什么数据 和 API 返回什么数据 的格式

namespace ITAMS_GME_BACKEND.DTOs
{
    public class AuthDTOs
    {
        public class LoginRequestDto
        {
            public string Email { get; set; } = string.Empty;
            public string Password { get; set; } = string.Empty;
        }

        public class LoginResponseDto
        {
            public string Token { get; set; } = string.Empty;
            public UserInfoDto User { get; set; } = null!;
        }

        public class UserInfoDto
        {
            public int Id { get; set; }
            public string Email { get; set; } = string.Empty;
            public string FullName { get; set; } = string.Empty;
            public string Username { get; set; } = string.Empty;
            public string Role { get; set; } = string.Empty;
            public List<string> Permissions { get; set; } = new List<string>();
        }
    }
}
