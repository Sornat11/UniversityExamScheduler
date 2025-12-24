using System;

namespace UniversityExamScheduler.Application.Exceptions;

public class EntityNotFoundException : Exception
{
    public EntityNotFoundException(string? message) : base(message) {}

}