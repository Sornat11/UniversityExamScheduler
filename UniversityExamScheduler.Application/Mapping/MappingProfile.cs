using System;
using AutoMapper;
using UniversityExamScheduler.Application.Dtos.User.Request;
using UniversityExamScheduler.Application.Dtos.User.Respone;
using UniversityExamScheduler.Application.Dtos.StudentGroup.Request;
using UniversityExamScheduler.Application.Dtos.StudentGroup.Respone;
using UniversityExamScheduler.Application.Dtos.Room.Request;
using UniversityExamScheduler.Application.Dtos.Room.Respone;
using UniversityExamScheduler.Application.Dtos.Exam.Request;
using UniversityExamScheduler.Application.Dtos.Exam.Respone;
using UniversityExamScheduler.Application.Dtos.ExamSession.Request;
using UniversityExamScheduler.Application.Dtos.ExamSession.Respone;
using UniversityExamScheduler.Application.Dtos.ExamTerm.Request;
using UniversityExamScheduler.Application.Dtos.ExamTerm.Respone;
using UniversityExamScheduler.Application.Dtos.ExamTermHistory.Request;
using UniversityExamScheduler.Application.Dtos.ExamTermHistory.Respone;
using UniversityExamScheduler.Domain.Entities;

namespace UniversityExamScheduler.Application.Mapping;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateMap<CreateUserDto, User>();
        CreateMap<User, GetUserDto>();
        CreateMap<UpdateUserDto, User>();

        CreateMap<CreateStudentGroupDto, StudentGroup>();
        CreateMap<StudentGroup, GetStudentGroupDto>();
        CreateMap<UpdateStudentGroupDto, StudentGroup>();

        CreateMap<CreateRoomDto, Room>();
        CreateMap<Room, GetRoomDto>();
        CreateMap<UpdateRoomDto, Room>();

        CreateMap<CreateExamDto, Exam>();
        CreateMap<Exam, GetExamDto>();
        CreateMap<UpdateExamDto, Exam>();

        CreateMap<CreateExamSessionDto, ExamSession>();
        CreateMap<ExamSession, GetExamSessionDto>();
        CreateMap<UpdateExamSessionDto, ExamSession>();

        CreateMap<CreateExamTermDto, ExamTerm>();
        CreateMap<ExamTerm, GetExamTermDto>();
        CreateMap<UpdateExamTermDto, ExamTerm>();

        CreateMap<CreateExamTermHistoryDto, ExamTermHistory>();
        CreateMap<ExamTermHistory, GetExamTermHistoryDto>();
        CreateMap<UpdateExamTermHistoryDto, ExamTermHistory>();
    }
}
