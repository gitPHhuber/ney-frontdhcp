import React, { useMemo } from 'react';
import {
  useWorkforceAssignmentsQuery,
  useWorkforceMembersQuery,
  useWorkforcePerformanceQuery,
  useWorkforceReportsQuery,
  useWorkforceTeamsQuery,
  useWorkforceUtilizationQuery,
} from './hooks';

const formatPercent = (value: number) => `${Math.round(value * 100)}%`;

export const WorkforceAnalytics: React.FC = () => {
  const { data: teams = [] } = useWorkforceTeamsQuery();
  const { data: members = [] } = useWorkforceMembersQuery();
  const { data: assignments = [] } = useWorkforceAssignmentsQuery();
  const { data: utilization = [] } = useWorkforceUtilizationQuery();
  const { data: performance = [] } = useWorkforcePerformanceQuery();
  const { data: reports = [] } = useWorkforceReportsQuery();

  const utilizationByTeam = useMemo(() => {
    const snapshot = new Map(
      utilization.map(item => [item.teamId, { actual: item.actual, target: item.target, overtime: item.overtimeHours }]),
    );
    return teams.map(team => ({
      team,
      utilization: snapshot.get(team.id) ?? { actual: 0, target: 0, overtime: 0 },
    }));
  }, [teams, utilization]);

  const memberPerformance = useMemo(() => {
    const perfMap = new Map(performance.map(item => [item.memberId, item]));
    return members
      .map(member => ({
        member,
        perf: perfMap.get(member.id),
        activeAssignments: assignments.filter(task => task.memberId === member.id && task.status !== 'completed').length,
      }))
      .sort((a, b) => (b.perf?.labourEfficiency ?? 0) - (a.perf?.labourEfficiency ?? 0))
      .slice(0, 6);
  }, [assignments, members, performance]);

  return (
    <section className="workforce" aria-label="Аналитика персонала">
      <header className="workforce__header">
        <div>
          <h1>Workforce Intelligence</h1>
          <p className="muted">
            Управляйте доступами по потокам, держите нагрузку сбалансированной и готовьте отчётность для руководства в один клик.
          </p>
        </div>
        <div className="workforce__actions">
          <button type="button" className="primary">Скачать отчёт</button>
          <button type="button" className="secondary">Отправить в Slack</button>
        </div>
      </header>
      <div className="workforce__grid">
        <article className="workforce__card workforce__card--wide">
          <header>
            <h2>Сегментация команд</h2>
            <p className="muted">Доступы и модели смен для каждой группы.</p>
          </header>
          <table className="workforce__table">
            <thead>
              <tr>
                <th>Команда</th>
                <th>Смена</th>
                <th>Доступ</th>
                <th>Численность</th>
                <th>Факт / цель</th>
                <th>Переработка</th>
              </tr>
            </thead>
            <tbody>
              {utilizationByTeam.map(({ team, utilization: snapshot }) => (
                <tr key={team.id}>
                  <td>
                    <div>
                      <strong>{team.name}</strong>
                      <p className="muted">{team.scope}</p>
                    </div>
                  </td>
                  <td>{team.shiftModel}</td>
                  <td>{team.accessScopes.join(', ')}</td>
                  <td>{team.headcount}</td>
                  <td>
                    {formatPercent(snapshot.actual)} / {formatPercent(snapshot.target)}
                  </td>
                  <td>{snapshot.overtime} ч</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
        <article className="workforce__card workforce__card--wide">
          <header>
            <h2>Лидеры производительности</h2>
            <p className="muted">Фокус на эффективность и текущую нагрузку.</p>
          </header>
          <ul className="workforce__members">
            {memberPerformance.map(entry => (
              <li key={entry.member.id}>
                <div>
                  <strong>{entry.member.name}</strong>
                  <p className="muted">{entry.member.title}</p>
                  <p className="muted">Навыки: {entry.member.skills.join(', ')}</p>
                </div>
                <div className="workforce__member-metrics">
                  <span>Заданий: {entry.activeAssignments}</span>
                  <span>Продуктивность: {formatPercent(entry.member.productivityScore)}</span>
                  <span>Эффективность: {formatPercent(entry.perf?.labourEfficiency ?? 0)}</span>
                  <span>FPY: {formatPercent(entry.perf?.firstPassYield ?? 0)}</span>
                </div>
              </li>
            ))}
          </ul>
        </article>
        <article className="workforce__card">
          <header>
            <h2>Текущие назначения</h2>
            <p className="muted">Контроль пересечений между потоками.</p>
          </header>
          <ul className="workforce__assignments">
            {assignments.map(item => (
              <li key={item.id}>
                <div>
                  <strong>{item.entityType} #{item.entityId}</strong>
                  <p className="muted">Статус: {item.status}</p>
                </div>
                <span>{item.effortHours} ч</span>
              </li>
            ))}
          </ul>
        </article>
        <article className="workforce__card">
          <header>
            <h2>Готовые отчёты</h2>
            <p className="muted">Готово к выгрузке для совещаний и аудита.</p>
          </header>
          <ul className="workforce__reports">
            {reports.map(report => (
              <li key={report.id}>
                <div>
                  <strong>{report.label}</strong>
                  <p className="muted">Ответственный: {report.ownerTeam}</p>
                  <p className="muted">Сформировано: {new Date(report.generatedAt).toLocaleString('ru-RU')}</p>
                </div>
                <ul>
                  {report.highlights.map((highlight, index) => (
                    <li key={index} className="muted">— {highlight}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
};
