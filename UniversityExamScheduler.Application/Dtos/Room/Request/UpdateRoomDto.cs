using System;
using UniversityExamScheduler.Domain.Enums;

namespace UniversityExamScheduler.Application.Dtos.Room.Request;

public class UpdateRoomDto
{
    public string RoomNumber { get; set; } = string.Empty;
    public int Capacity { get; set; }
    public RoomType Type { get; set; }
    public bool IsAvailable { get; set; }
}
