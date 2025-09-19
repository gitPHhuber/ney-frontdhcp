import React from 'react';
import { TaskBoard } from '../../features/tasks/TaskBoard';

const TaskBoardPage: React.FC = () => {
  return (
    <div className="page taskboard-page">
      <TaskBoard />
    </div>
  );
};

export default TaskBoardPage;
