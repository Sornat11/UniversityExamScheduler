using System;
using AutoMapper;
using UniversityExamScheduler.Application.Dtos.User;
using UniversityExamScheduler.Application.Dtos.User.Respone;
using UniversityExamScheduler.Domain.Entities;

namespace UniversityExamScheduler.Application.Mapping;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateMap<CreateUserDto, User>();
        CreateMap<User, GetUserDto>();
    }
}
