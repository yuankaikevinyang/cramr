import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

const PomodoroTimer = () => {
  const [mode, setMode] = React.useState('work');
  const [timeLeft, setTimeLeft] = React.useState(1500);
  const [isRunning, setIsRunning] = React.useState(false);
  const [tasks, setTasks] = React.useState<string[]>([]);
  const [newTask, setNewTask] = React.useState('');
  const [round, setRound] = React.useState(1);

  const startTimer = () => setIsRunning(true);
  const pauseTimer = () => setIsRunning(false);
  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(1500);
  };

  const addTask = () => {
    if (newTask.trim()) {
      setTasks([...tasks, newTask.trim()]);
      setNewTask('');
    }
  };

  const removeTask = (index: number) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  const switchMode = (newMode: string) => {
    setMode(newMode);
    setIsRunning(false);
    if (newMode === 'work') {
      setTimeLeft(1500);
    } else if (newMode === 'shortBreak') {
      setTimeLeft(300);
    } else if (newMode === 'longBreak') {
      setTimeLeft(900);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return React.createElement(View, { testID: 'pomodoro-timer' },
    React.createElement(View, { testID: 'mode-selection' },
      React.createElement(TouchableOpacity, {
        testID: 'work-mode',
        onPress: () => switchMode('work')
      }, React.createElement(Text, null, 'Work')),
      React.createElement(TouchableOpacity, {
        testID: 'short-break-mode',
        onPress: () => switchMode('shortBreak')
      }, React.createElement(Text, null, 'Short Break')),
      React.createElement(TouchableOpacity, {
        testID: 'long-break-mode',
        onPress: () => switchMode('longBreak')
      }, React.createElement(Text, null, 'Long Break'))
    ),

    React.createElement(Text, { testID: 'timer-display' }, formatTime(timeLeft)),
    React.createElement(Text, { testID: 'round-indicator' }, `Round ${round} of 4`),

    React.createElement(View, { testID: 'controls' },
      isRunning ? 
        React.createElement(TouchableOpacity, {
          testID: 'pause-button',
          onPress: pauseTimer
        }, React.createElement(Text, null, 'Pause')) :
        React.createElement(TouchableOpacity, {
          testID: 'start-button',
          onPress: startTimer
        }, React.createElement(Text, null, 'Start')),
      
      React.createElement(TouchableOpacity, {
        testID: 'reset-button',
        onPress: resetTimer
      }, React.createElement(Text, null, 'Reset'))
    ),

    React.createElement(View, { testID: 'tasks-section' },
      React.createElement(Text, null, 'Tasks'),
      React.createElement(TextInput, {
        testID: 'task-input',
        value: newTask,
        onChangeText: setNewTask,
        placeholder: 'Add a task...'
      }),
      React.createElement(TouchableOpacity, {
        testID: 'add-task-button',
        onPress: addTask
      }, React.createElement(Text, null, 'Add')),
      
      React.createElement(View, { testID: 'tasks-list' },
        tasks.map((task, index) => 
          React.createElement(View, { key: index, testID: `task-${index}` },
            React.createElement(Text, null, task),
            React.createElement(TouchableOpacity, {
              testID: `delete-task-${index}`,
              onPress: () => removeTask(index)
            }, React.createElement(Text, null, '×'))
          )
        )
      )
    )
  );
};

describe('PomodoroTimer', () => {
  it('renders pomodoro timer with initial work mode', () => {
    render(React.createElement(PomodoroTimer));
    
    expect(screen.getByTestId('pomodoro-timer')).toBeTruthy();
    expect(screen.getByText('Work')).toBeTruthy();
    expect(screen.getByText('25:00')).toBeTruthy();
  });

  it('switches between timer modes', () => {
    render(React.createElement(PomodoroTimer));
    
    const shortBreakButton = screen.getByTestId('short-break-mode');
    fireEvent.press(shortBreakButton);
    expect(screen.getByText('05:00')).toBeTruthy();
    
    const longBreakButton = screen.getByTestId('long-break-mode');
    fireEvent.press(longBreakButton);
    expect(screen.getByText('15:00')).toBeTruthy();
  });

  it('starts and stops timer', () => {
    render(React.createElement(PomodoroTimer));
    
    const startButton = screen.getByTestId('start-button');
    fireEvent.press(startButton);
    
    // Should show pause button
    expect(screen.getByTestId('pause-button')).toBeTruthy();
    
    const pauseButton = screen.getByTestId('pause-button');
    fireEvent.press(pauseButton);
    
    // Should show start button again
    expect(screen.getByTestId('start-button')).toBeTruthy();
  });

  it('resets timer', () => {
    render(React.createElement(PomodoroTimer));
    
    const resetButton = screen.getByTestId('reset-button');
    fireEvent.press(resetButton);
    
    // Should show initial time
    expect(screen.getByText('25:00')).toBeTruthy();
  });

  it('adds and removes tasks', () => {
    render(React.createElement(PomodoroTimer));
    
    const addTaskInput = screen.getByTestId('task-input');
    fireEvent.changeText(addTaskInput, 'Test task');
    
    const addButton = screen.getByTestId('add-task-button');
    fireEvent.press(addButton);
    expect(screen.getByText('Test task')).toBeTruthy();
    
    const deleteButton = screen.getByTestId('delete-task-0');
    fireEvent.press(deleteButton);
    expect(screen.queryByText('Test task')).toBeNull();
  });

  it('shows round indicator', () => {
    render(React.createElement(PomodoroTimer));
    
    expect(screen.getByText('Round 1 of 4')).toBeTruthy();
  });

  it('handles empty task input', () => {
    render(React.createElement(PomodoroTimer));
    
    const addButton = screen.getByTestId('add-task-button');
    fireEvent.press(addButton);
    
    // Should not add empty task
    expect(screen.queryByText('')).toBeNull();
  });
});
