"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Loader2, ListChecks } from 'lucide-react';
import { toast } from 'sonner';

interface Task {
    id: string;
    title: string;
    is_completed: boolean;
    due_date?: string;
}

interface OpportunityTasksProps {
    opportunityId: string;
}

export function OpportunityTasks({ opportunityId }: OpportunityTasksProps) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    useEffect(() => {
        const fetchTasks = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('opportunity_tasks')
                    .select('*')
                    .eq('opportunity_id', opportunityId)
                    .order('created_at', { ascending: true });

                if (error) throw error;
                setTasks(data || []);
            } catch (error) {
                console.error('Error fetching tasks:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTasks();
    }, [opportunityId]);

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskTitle.trim()) return;

        setIsAdding(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            const { data, error } = await supabase
                .from('opportunity_tasks')
                .insert([{
                    opportunity_id: opportunityId,
                    title: newTaskTitle.trim(),
                    user_id: user.id
                }])
                .select()
                .single();

            if (error) throw error;
            setTasks([...tasks, data]);
            setNewTaskTitle('');
            toast.success('Task added');
        } catch (error) {
            console.error('Error adding task:', error);
            toast.error('Failed to add task');
        } finally {
            setIsAdding(false);
        }
    };

    const toggleTask = async (taskId: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from('opportunity_tasks')
                .update({ is_completed: !currentStatus })
                .eq('id', taskId);

            if (error) throw error;
            setTasks(tasks.map(t => t.id === taskId ? { ...t, is_completed: !currentStatus } : t));
        } catch (error) {
            console.error('Error toggling task:', error);
            toast.error('Failed to update task');
        }
    };

    const deleteTask = async (taskId: string) => {
        try {
            const { error } = await supabase
                .from('opportunity_tasks')
                .delete()
                .eq('id', taskId);

            if (error) throw error;
            setTasks(tasks.filter(t => t.id !== taskId));
            toast.success('Task deleted');
        } catch (error) {
            console.error('Error deleting task:', error);
            toast.error('Failed to delete task');
        }
    };

    return (
        <Card className="shadow-sm border-gray-200">
            <CardHeader className="pb-3 border-b border-gray-50">
                <CardTitle className="text-sm font-semibold flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ListChecks className="h-4 w-4 text-emerald-600" />
                        Internal Tasks
                    </div>
                    {tasks.length > 0 && (
                        <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-500 font-normal">
                            {tasks.filter(t => t.is_completed).length}/{tasks.length}
                        </span>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
                <form onSubmit={handleAddTask} className="flex gap-2 mb-4">
                    <Input
                        placeholder="Add a new task..."
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        className="h-8 text-xs"
                    />
                    <Button type="submit" size="sm" className="h-8 px-2" disabled={isAdding || !newTaskTitle.trim()}>
                        {isAdding ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                    </Button>
                </form>

                {loading ? (
                    <div className="py-4 text-center">
                        <Loader2 className="h-4 w-4 animate-spin mx-auto text-gray-300" />
                    </div>
                ) : tasks.length === 0 ? (
                    <div className="py-6 text-center text-xs text-gray-400 bg-gray-50/50 rounded-md border border-dashed">
                        No tasks yet. Plan your next steps here.
                    </div>
                ) : (
                    <div className="space-y-2">
                        {tasks.map((task) => (
                            <div
                                key={task.id}
                                className="flex items-center justify-between group p-2 hover:bg-gray-50 rounded transition-colors"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <Checkbox
                                        checked={task.is_completed}
                                        onCheckedChange={() => toggleTask(task.id, task.is_completed)}
                                        className="h-4 w-4 border-gray-300"
                                    />
                                    <span className={`text-xs truncate ${task.is_completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                                        {task.title}
                                    </span>
                                </div>
                                <button
                                    onClick={() => deleteTask(task.id)}
                                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
                                >
                                    <Trash2 className="h-3 w-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
