import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import TaskCard from './TaskCard';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const COLUMNS = {
  'pending': { id: 'pending', title: 'Pending' },
  'in-progress': { id: 'in-progress', title: 'In Progress' },
  'completed': { id: 'completed', title: 'Completed' },
  'reviewed': { id: 'reviewed', title: 'Reviewed' }
};

const TaskBoard = ({ tasks, onUpdate }) => {
  const [boardData, setBoardData] = useState({
    'pending': [],
    'in-progress': [],
    'completed': [],
    'reviewed': []
  });

  useEffect(() => {
    const newBoardData = {
      'pending': [],
      'in-progress': [],
      'completed': [],
      'reviewed': []
    };
    tasks.forEach(task => {
      if (newBoardData[task.status]) {
        newBoardData[task.status].push(task);
      }
    });
    setBoardData(newBoardData);
  }, [tasks]);

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const startColumn = source.droppableId;
    const finishColumn = destination.droppableId;
    
    // Optimistic UI update
    const startTasks = Array.from(boardData[startColumn]);
    const finishTasks = startColumn === finishColumn ? startTasks : Array.from(boardData[finishColumn]);
    
    const [removed] = startTasks.splice(source.index, 1);
    removed.status = finishColumn; // Temporarily update status for optimistic UI
    if (startColumn === finishColumn) {
      startTasks.splice(destination.index, 0, removed);
      setBoardData(prev => ({ ...prev, [startColumn]: startTasks }));
      return; // No status change logic if same column reordering
    } else {
      finishTasks.splice(destination.index, 0, removed);
      setBoardData(prev => ({
        ...prev,
        [startColumn]: startTasks,
        [finishColumn]: finishTasks
      }));
    }

    try {
      await api.put(`/tasks/${draggableId}/status`, { status: finishColumn });
      toast.success(`Moved to ${COLUMNS[finishColumn].title}`);
      onUpdate();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
      onUpdate(); // Revert on failure by refetching
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto pb-4">
        {Object.keys(COLUMNS).map(columnId => {
          const column = COLUMNS[columnId];
          const columnTasks = boardData[columnId] || [];

          return (
            <div key={columnId} className="flex flex-col bg-secondary border border-border-color rounded-xl min-w-[280px] shadow-sm">
              <div className="p-4 border-b border-border-color bg-background rounded-t-xl font-semibold text-text-primary flex justify-between items-center">
                {column.title}
                <span className="bg-primary/10 text-primary-600 dark:text-primary-400 text-xs py-0.5 px-2 rounded-full font-bold">
                  {columnTasks.length}
                </span>
              </div>
              <Droppable droppableId={columnId}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 p-3 min-h-[500px] transition-colors rounded-b-xl ${
                      snapshot.isDraggingOver ? 'bg-primary-50 dark:bg-primary-900/10' : 'bg-secondary'
                    }`}
                  >
                    {columnTasks.map((task, index) => (
                      <Draggable key={task._id} draggableId={task._id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`mb-3 ${snapshot.isDragging ? 'opacity-90 scale-105 shadow-xl' : ''}`}
                            style={{
                              ...provided.draggableProps.style,
                            }}
                          >
                            <TaskCard task={task} onUpdate={onUpdate} />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
};

export default TaskBoard;
