using UniversityExamScheduler.Domain.Entities;

namespace UniversityExamScheduler.Domain.Tests.Entities;

public class EntityDefaultsTests
{
    [Fact]
    public void User_ShouldHave_DefaultCollections_And_IsActiveTrue()
    {
        var user = new User();

        user.IsActive.Should().BeTrue();
        user.Email.Should().BeEmpty();
        user.FirstName.Should().BeEmpty();
        user.LastName.Should().BeEmpty();
        user.GroupMemberships.Should().NotBeNull().And.BeEmpty();
        user.StarostaGroups.Should().NotBeNull().And.BeEmpty();
    }

    [Fact]
    public void StudentGroup_ShouldHave_DefaultCollections_And_StringsEmpty()
    {
        var group = new StudentGroup();

        group.Name.Should().BeEmpty();
        group.FieldOfStudy.Should().BeEmpty();
        group.Members.Should().NotBeNull().And.BeEmpty();
        group.Courses.Should().NotBeNull().And.BeEmpty();
    }

    [Fact]
    public void Room_ShouldHave_DefaultCollections_And_IsAvailableTrue()
    {
        var room = new Room();

        room.RoomNumber.Should().BeEmpty();
        room.IsAvailable.Should().BeTrue();
        room.ExamTerms.Should().NotBeNull().And.BeEmpty();
    }

    [Fact]
    public void Exam_ShouldHave_DefaultCollections_And_NameEmpty()
    {
        var exam = new Exam();

        exam.Name.Should().BeEmpty();
        exam.ExamTerms.Should().NotBeNull().And.BeEmpty();
    }

    [Fact]
    public void ExamSession_ShouldHave_DefaultCollections_And_NameEmpty()
    {
        var session = new ExamSession();

        session.Name.Should().BeEmpty();
        session.ExamTerms.Should().NotBeNull().And.BeEmpty();
    }

    [Fact]
    public void ExamTerm_ShouldHave_DefaultHistory()
    {
        var term = new ExamTerm();

        term.History.Should().NotBeNull().And.BeEmpty();
    }

    [Fact]
    public void ExamTermHistory_ShouldDefault_ToNullComment()
    {
        var history = new ExamTermHistory();

        history.Comment.Should().BeNull();
    }
}
