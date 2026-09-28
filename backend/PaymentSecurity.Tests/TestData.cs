using System.Collections;
using System.Linq.Expressions;
using ApartmentManagement.Api.Data;
using ApartmentManagement.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Query;
using Microsoft.EntityFrameworkCore.Metadata;

// Queryable fixtures, not a database. No migrations or production startup are run.
sealed class TestData : AppDbContext
{
    public TestData() : base(new DbContextOptionsBuilder<AppDbContext>().Options)
    {
        Residents = new TestSet<Resident>();
        UserAccounts = new TestSet<UserAccount>();
        Invoices = new TestSet<Invoice>();
        Payments = new TestSet<Payment>();
        Receipts = new TestSet<Receipt>();
        InvoiceItems = new TestSet<InvoiceItem>();
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var payment in Payments)
        {
            payment.Invoice = Invoices.First(i => i.Id == payment.InvoiceId);
            if (!payment.Invoice.Payments.Contains(payment)) payment.Invoice.Payments.Add(payment);
        }
        foreach (var receipt in Receipts)
        {
            var payment = Payments.First(p => p.Id == receipt.PaymentId);
            payment.Receipt = receipt;
        }
        return Task.FromResult(1);
    }
}

sealed class TestSet<T> : DbSet<T>, IQueryable<T>, IAsyncEnumerable<T> where T : class
{
    private readonly List<T> rows = [];
    private IQueryable<T> Query => new AsyncQuery<T>(rows);
    public override IEntityType EntityType => throw new NotSupportedException();
    Type IQueryable.ElementType => typeof(T);
    Expression IQueryable.Expression => Query.Expression;
    IQueryProvider IQueryable.Provider => Query.Provider;
    IEnumerator<T> IEnumerable<T>.GetEnumerator() => rows.GetEnumerator();
    IEnumerator IEnumerable.GetEnumerator() => rows.GetEnumerator();
    public override IAsyncEnumerator<T> GetAsyncEnumerator(CancellationToken token = default) => new AsyncEnumerator<T>(rows.GetEnumerator());
    public override EntityEntry<T> Add(T entity)
    {
        var id = typeof(T).GetProperty("Id")!;
        if ((int)id.GetValue(entity)! == 0) id.SetValue(entity, rows.Count == 0 ? 1 : rows.Max(r => (int)id.GetValue(r)!) + 1);
        rows.Add(entity);
        return null!;
    }
    public override EntityEntry<T> Remove(T entity) { rows.Remove(entity); return null!; }
    public override void AddRange(IEnumerable<T> entities) { foreach (var row in entities) Add(row); }
    public override void RemoveRange(IEnumerable<T> entities) { foreach (var row in entities.ToList()) rows.Remove(row); }
    public override ValueTask<T?> FindAsync(params object?[]? keyValues) => ValueTask.FromResult(
        rows.FirstOrDefault(row => Equals(typeof(T).GetProperty("Id")!.GetValue(row), keyValues![0])));
}

sealed class AsyncQuery<T> : EnumerableQuery<T>, IAsyncEnumerable<T>, IQueryable<T>
{
    public AsyncQuery(IEnumerable<T> rows) : base(rows) { }
    public AsyncQuery(Expression expression) : base(expression) { }
    IQueryProvider IQueryable.Provider => new AsyncProvider(this);
    public IAsyncEnumerator<T> GetAsyncEnumerator(CancellationToken token = default) => new AsyncEnumerator<T>(this.AsEnumerable().GetEnumerator());
}

sealed class AsyncProvider(IQueryProvider inner) : IAsyncQueryProvider
{
    public IQueryable CreateQuery(Expression expression) => throw new NotSupportedException();
    public IQueryable<T> CreateQuery<T>(Expression expression) => new AsyncQuery<T>(expression);
    public object? Execute(Expression expression) => inner.Execute(expression);
    public T Execute<T>(Expression expression) => inner.Execute<T>(expression);
    public TResult ExecuteAsync<TResult>(Expression expression, CancellationToken token = default)
    {
        var type = typeof(TResult).GetGenericArguments()[0];
        var value = typeof(IQueryProvider).GetMethod(nameof(Execute), 1, [typeof(Expression)])!
            .MakeGenericMethod(type).Invoke(inner, [expression]);
        return (TResult)typeof(Task).GetMethod(nameof(Task.FromResult))!.MakeGenericMethod(type).Invoke(null, [value])!;
    }
}

sealed class AsyncEnumerator<T>(IEnumerator<T> inner) : IAsyncEnumerator<T>
{
    public T Current => inner.Current;
    public ValueTask<bool> MoveNextAsync() => ValueTask.FromResult(inner.MoveNext());
    public ValueTask DisposeAsync() { inner.Dispose(); return ValueTask.CompletedTask; }
}
