using System;
using Microsoft.EntityFrameworkCore;
using UniversityExamScheduler.Domain.Entities;

namespace UniversityExamScheduler.Infrastructure.Persistence;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<StudentGroup> StudentGroups => Set<StudentGroup>();
    public DbSet<GroupMember> GroupMembers => Set<GroupMember>();
    public DbSet<Room> Rooms => Set<Room>();
    public DbSet<ExamSession> ExamSessions => Set<ExamSession>();
    public DbSet<Exam> Exams => Set<Exam>();
    public DbSet<ExamTerm> ExamTerms => Set<ExamTerm>();
    public DbSet<ExamTermHistory> ExamTermHistories => Set<ExamTermHistory>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<GroupMember>(entity =>
        {
            entity.HasKey(e => new { e.GroupId, e.StudentId });
            entity.Property(e => e.GroupId).HasColumnName("group_id");
            entity.Property(e => e.StudentId).HasColumnName("student_id");

            entity.HasOne(e => e.Group)
                .WithMany(g => g.Members)
                .HasForeignKey(e => e.GroupId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Student)
                .WithMany(u => u.GroupMemberships)
                .HasForeignKey(e => e.StudentId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }

}
