using AutoMapper;
using UniversityExamScheduler.Application.Dtos.User.Respone;
using UniversityExamScheduler.Application.Mapping;
using UniversityExamScheduler.Domain.Entities;
using UniversityExamScheduler.Domain.Enums;

namespace UniversityExamScheduler.Application.Tests.Mapping;

public class MappingProfileTests
{
    [Fact]
    public void UserMapping_ShouldIncludeStudentGroups()
    {
        var config = new MapperConfiguration(cfg => cfg.AddProfile<MappingProfile>());
        var mapper = config.CreateMapper();

        var group = new StudentGroup
        {
            Id = Guid.NewGuid(),
            Name = "G1",
            FieldOfStudy = "CS",
            StudyType = StudyType.Stacjonarne,
            Semester = 1
        };
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "user@example.com",
            FirstName = "Jan",
            LastName = "Kowalski",
            Role = Role.Student
        };
        user.GroupMemberships.Add(new GroupMember
        {
            GroupId = group.Id,
            Group = group,
            StudentId = user.Id,
            Student = user
        });

        var dto = mapper.Map<GetUserDto>(user);

        dto.StudentGroups.Should().ContainSingle(g => g.Name == "G1");
    }
}
