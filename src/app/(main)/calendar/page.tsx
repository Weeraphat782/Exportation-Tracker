'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Edit2, Save, X, Plus, Eye, StickyNote, FileText } from 'lucide-react';
import { Quotation } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { MobileMenuButton } from '@/components/ui/mobile-menu-button';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

interface QuotationEvent extends Quotation {
  shipping_date?: string | null;
}

interface CalendarNote {
  id: string;
  quotation_id: string;
  user_id: string;
  note_text: string;
  created_at: string;
  updated_at: string;
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [quotations, setQuotations] = useState<QuotationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuotation, setSelectedQuotation] = useState<QuotationEvent | null>(null);
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [editingShippingDate, setEditingShippingDate] = useState('');
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [quotationToAssign, setQuotationToAssign] = useState('');
  const [availableQuotations, setAvailableQuotations] = useState<QuotationEvent[]>([]);
  const [calendarNotes, setCalendarNotes] = useState<CalendarNote[]>([]);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [editingNote, setEditingNote] = useState('');

  useEffect(() => {
    loadQuotations();
    loadCalendarNotes();
  }, []);

  const loadCalendarNotes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('calendar_notes')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error loading calendar notes:', error);
        return;
      }

      console.log('Loaded calendar notes:', data);
      setCalendarNotes(data || []);
    } catch (error) {
      console.error('Error in loadCalendarNotes:', error);
    }
  };

  const loadQuotations = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please log in to view quotations');
        return;
      }

      // Simple query without joins for Calendar
      const { data, error } = await supabase
        .from('quotations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching quotations:', error);
        toast.error('Failed to load quotations');
        return;
      }

      console.log('Loaded quotations:', data);
      
      // Filter out completed quotations but include sent and docs_uploaded
      const activeQuotations = data.filter(q => 
        q.status !== 'completed' && 
        q.status !== 'rejected'
      );
      console.log('Active quotations (excluding completed/rejected):', activeQuotations);
      
      // Use real data from database
      const quotationsWithShippingDates = activeQuotations.map(q => ({
        ...q,
        // Add fallback values for display
        company_name: q.company_name || 'Unknown Company',
        destination: q.destination || 'Unknown Destination'
      }));
      
      console.log('Quotations with shipping dates:', quotationsWithShippingDates);
      setQuotations(quotationsWithShippingDates);
      
      // Show all quotations for assignment (including completed ones for flexibility)
      setAvailableQuotations(data || []);
      
    } catch (error) {
      console.error('Error loading quotations:', error);
      toast.error('Failed to load quotations: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const currentDay = new Date(startDate);
    
    while (days.length < 42) { // 6 weeks × 7 days
      days.push(new Date(currentDay));
      currentDay.setDate(currentDay.getDate() + 1);
    }
    
    return days;
  };

  const getQuotationsForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    const filtered = quotations.filter(q => q.shipping_date === dateString);
    if (filtered.length > 0) {
      console.log(`Date ${dateString} has ${filtered.length} quotations:`, filtered);
    }
    return filtered;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'sent': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'docs_uploaded': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleQuotationClick = (quotation: QuotationEvent, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedQuotation(quotation);
    setEditingShippingDate(quotation.shipping_date || '');
    
    // Load calendar note for this quotation
    const existingNote = calendarNotes.find(note => note.quotation_id === quotation.id);
    setEditingNote(existingNote?.note_text || '');
    
    setIsEditingDate(false);
    setIsEditingNote(false);
  };

  const handleDateClick = (date: Date) => {
    if (!isCurrentMonth(date)) return;
    
    setSelectedDate(date);
    setShowAssignDialog(true);
    setQuotationToAssign('');
  };

  const handleAssignQuotation = async () => {
    if (!selectedDate || !quotationToAssign) return;
    
    try {
      const dateString = selectedDate.toISOString().split('T')[0];
      
      // Update in database
      const { error } = await supabase
        .from('quotations')
        .update({ shipping_date: dateString })
        .eq('id', quotationToAssign);

      if (error) {
        console.error('Error updating shipping date:', error);
        toast.error('Failed to assign quotation to date');
        return;
      }

      // Update local state
      const updatedQuotations = quotations.map(q => 
        q.id === quotationToAssign 
          ? { ...q, shipping_date: dateString }
          : q
      );
      
      setQuotations(updatedQuotations);
      setAvailableQuotations(updatedQuotations.filter(q => 
        (q.status === 'sent' || q.status === 'docs_uploaded') && !q.shipping_date
      ));
      setShowAssignDialog(false);
      toast.success('Quotation assigned to date successfully');
    } catch (error) {
      console.error('Error assigning quotation:', error);
      toast.error('Failed to assign quotation to date');
    }
  };

  const handleSaveShippingDate = async () => {
    if (!selectedQuotation) return;
    
    try {
      // Update in database
      const { error } = await supabase
        .from('quotations')
        .update({ shipping_date: editingShippingDate || null })
        .eq('id', selectedQuotation.id);

      if (error) {
        console.error('Error updating shipping date:', error);
        toast.error('Failed to update shipping date');
        return;
      }

      // Update local state
      const updatedQuotations = quotations.map(q => 
        q.id === selectedQuotation.id 
          ? { ...q, shipping_date: editingShippingDate || null }
          : q
      );
      setQuotations(updatedQuotations);
      
      // Update available quotations list
      setAvailableQuotations(updatedQuotations.filter(q => 
        (q.status === 'sent' || q.status === 'docs_uploaded') && !q.shipping_date
      ));
      
      setSelectedQuotation({
        ...selectedQuotation,
        shipping_date: editingShippingDate || null
      });
      
      setIsEditingDate(false);
      toast.success('Shipping date updated successfully');
    } catch (error) {
      console.error('Error updating shipping date:', error);
      toast.error('Failed to update shipping date');
    }
  };

  const handleRemoveShippingDate = async () => {
    if (!selectedQuotation) return;
    
    try {
      // Update in database
      const { error } = await supabase
        .from('quotations')
        .update({ shipping_date: null })
        .eq('id', selectedQuotation.id);

      if (error) {
        console.error('Error removing shipping date:', error);
        toast.error('Failed to remove shipping date');
        return;
      }

      // Update local state
      const updatedQuotations = quotations.map(q => 
        q.id === selectedQuotation.id 
          ? { ...q, shipping_date: null }
          : q
      );
      setQuotations(updatedQuotations);
      
      // Update available quotations list
      setAvailableQuotations(updatedQuotations.filter(q => 
        (q.status === 'sent' || q.status === 'docs_uploaded') && !q.shipping_date
      ));
      
      setSelectedQuotation({
        ...selectedQuotation,
        shipping_date: null
      });
      
      setEditingShippingDate('');
      toast.success('Shipping date removed');
    } catch (error) {
      console.error('Error removing shipping date:', error);
      toast.error('Failed to remove shipping date');
    }
  };

  const handleSaveNote = async () => {
    if (!selectedQuotation) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please log in to save notes');
        return;
      }

      const existingNote = calendarNotes.find(note => note.quotation_id === selectedQuotation.id);
      
      if (editingNote.trim()) {
        // Save or update note
        if (existingNote) {
          // Update existing note
          const { error } = await supabase
            .from('calendar_notes')
            .update({ note_text: editingNote.trim() })
            .eq('id', existingNote.id);

          if (error) {
            console.error('Error updating calendar note:', error);
            toast.error('Failed to update note');
            return;
          }

          // Update local state
          setCalendarNotes(notes => 
            notes.map(note => 
              note.id === existingNote.id 
                ? { ...note, note_text: editingNote.trim() }
                : note
            )
          );
        } else {
          // Create new note
          const { data, error } = await supabase
            .from('calendar_notes')
            .insert({
              quotation_id: selectedQuotation.id,
              user_id: user.id,
              note_text: editingNote.trim()
            })
            .select()
            .single();

          if (error) {
            console.error('Error creating calendar note:', error);
            toast.error('Failed to create note');
            return;
          }

          // Add to local state
          setCalendarNotes(notes => [...notes, data]);
        }
      } else if (existingNote) {
        // Delete note if empty
        const { error } = await supabase
          .from('calendar_notes')
          .delete()
          .eq('id', existingNote.id);

        if (error) {
          console.error('Error deleting calendar note:', error);
          toast.error('Failed to delete note');
          return;
        }

        // Remove from local state
        setCalendarNotes(notes => notes.filter(note => note.id !== existingNote.id));
      }
      
      setIsEditingNote(false);
      toast.success('Note saved successfully');
    } catch (error) {
      console.error('Error saving note:', error);
      toast.error('Failed to save note');
    }
  };

  const days = getDaysInMonth(currentDate);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-pulse text-lg">Loading calendar...</div>
      </div>
    );
  }

  return (
    <div className="space-y-2 sm:space-y-3">
      <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="flex items-center gap-3">
          <MobileMenuButton />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Calendar</h1>
            <p className="text-gray-600 mt-0.5 text-xs sm:text-sm">
              Track quotation shipping dates 
              {quotations.length > 0 && (
                <span className="ml-2 text-xs sm:text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {quotations.length} quotations loaded
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex gap-2 self-start sm:self-auto">
          <Button onClick={goToToday} variant="outline" size="sm" className="flex-1 sm:flex-none">
            <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="text-xs sm:text-sm">Today</span>
          </Button>
          <Button onClick={loadQuotations} variant="outline" size="sm" className="flex-1 sm:flex-none">
            <span className="text-xs sm:text-sm">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Calendar Header */}
      <Card>
        <CardHeader className="pb-2 sm:pb-6">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => navigateMonth('prev')} className="h-8 w-8 sm:h-10 sm:w-10 p-0">
              <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
            <CardTitle className="text-lg sm:text-xl font-semibold">
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigateMonth('next')} className="h-8 w-8 sm:h-10 sm:w-10 p-0">
              <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-2 sm:p-6">
          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-1 sm:mb-2">
            {DAYS_OF_WEEK.map(day => (
              <div key={day} className="p-1 sm:p-2 text-center text-xs sm:text-sm font-medium text-gray-500">
                <span className="hidden sm:inline">{day}</span>
                <span className="sm:hidden">{day.slice(0, 1)}</span>
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
            {days.map((day, index) => {
              const dayQuotations = getQuotationsForDate(day);
              const isCurrentMonthDay = isCurrentMonth(day);
              const isTodayDay = isToday(day);

              return (
                <div
                  key={index}
                  onClick={() => handleDateClick(day)}
                  className={`
                    min-h-[80px] sm:min-h-[120px] p-1 sm:p-2 border border-gray-200 rounded cursor-pointer
                    ${isCurrentMonthDay ? 'bg-white hover:bg-gray-50' : 'bg-gray-50'}
                    ${isTodayDay ? 'ring-2 ring-blue-500' : ''}
                    transition-colors
                  `}
                >
                  <div className={`
                    text-xs sm:text-sm font-medium mb-0.5 sm:mb-1
                    ${isCurrentMonthDay ? 'text-gray-900' : 'text-gray-400'}
                    ${isTodayDay ? 'text-blue-600' : ''}
                  `}>
                    {day.getDate()}
                  </div>
                  
                  {/* Quotation Events */}
                  <div className="space-y-0.5 sm:space-y-1">
                    {dayQuotations.slice(0, 2).map(quotation => (
                      <div
                        key={quotation.id}
                        onClick={(e) => handleQuotationClick(quotation, e)}
                        className={`
                          text-xs p-0.5 sm:p-1 rounded cursor-pointer hover:opacity-80 space-y-0.5 sm:space-y-1
                          ${getStatusColor(quotation.status)}
                        `}
                        title={`${quotation.customer_name || quotation.company_name} - ${quotation.destination} (Created: ${new Date(quotation.created_at).toLocaleDateString()})`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="truncate font-medium min-w-0 flex-1">
                            <div className="text-xs font-semibold text-gray-700 truncate">
                              {quotation.company_name}
                            </div>
                            <div className="text-xs truncate hidden sm:block">
                              {quotation.customer_name}
                            </div>
                          </div>
                          <Eye className="h-2 w-2 sm:h-3 sm:w-3 ml-1 opacity-60 flex-shrink-0" />
                        </div>
                        <div className="flex items-center justify-between text-xs opacity-75">
                          <div className="flex items-center space-x-0.5 sm:space-x-1 min-w-0 flex-1">
                            <span className="truncate text-xs">
                              {quotation.status.toUpperCase()}
                            </span>
                            <div className="flex items-center space-x-0.5">
                              {quotation.notes && (
                                <div title="Has quotation note">
                                  <FileText className="h-2 w-2 sm:h-3 sm:w-3 text-blue-600" />
                                </div>
                              )}
                              {calendarNotes.some(note => note.quotation_id === quotation.id) && (
                                <div title="Has calendar note">
                                  <StickyNote className="h-2 w-2 sm:h-3 sm:w-3 text-yellow-600" />
                                </div>
                              )}
                            </div>
                          </div>
                          <span className="text-xs flex-shrink-0 hidden sm:inline">
                            {new Date(quotation.created_at).toLocaleDateString('en-GB', { 
                              day: '2-digit', 
                              month: '2-digit' 
                            })}
                          </span>
                        </div>
                      </div>
                    ))}
                    {dayQuotations.length > 2 && (
                      <div className="text-xs text-center py-0.5 text-gray-500 font-medium">
                        +{dayQuotations.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quotation Details Modal */}
      <Dialog open={!!selectedQuotation} onOpenChange={() => setSelectedQuotation(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-md lg:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Quotation Details</DialogTitle>
          </DialogHeader>
          
          {selectedQuotation && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Company</Label>
                <p className="text-sm text-gray-600">{selectedQuotation.company_name}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Customer Name</Label>
                <p className="text-sm text-gray-600">{selectedQuotation.customer_name || 'N/A'}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Destination</Label>
                <p className="text-sm text-gray-600">{selectedQuotation.destination}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Status</Label>
                <Badge className={getStatusColor(selectedQuotation.status)}>
                  {selectedQuotation.status}
                </Badge>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Total Cost</Label>
                <p className="text-sm text-gray-600">
                  {selectedQuotation.total_cost.toLocaleString()} THB
                </p>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Created Date</Label>
                <p className="text-sm text-gray-600">
                  {new Date(selectedQuotation.created_at).toLocaleDateString('en-GB', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>

              {/* Shipping Date Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium">Shipping Date</Label>
                  {!isEditingDate && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditingDate(true)}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                
                {isEditingDate ? (
                  <div className="flex items-center space-x-2">
                    <Input
                      type="date"
                      value={editingShippingDate}
                      onChange={(e) => setEditingShippingDate(e.target.value)}
                      className="flex-1"
                    />
                    <Button size="sm" onClick={handleSaveShippingDate}>
                      <Save className="h-3 w-3" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => setIsEditingDate(false)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      {selectedQuotation.shipping_date || 'Not set'}
                    </p>
                    {selectedQuotation.shipping_date && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveShippingDate}
                        className="text-red-600 hover:text-red-700"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Quotation Notes Section */}
              {selectedQuotation.notes && (
                <div>
                  <Label className="text-sm font-medium">Quotation Notes</Label>
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex items-start">
                      <FileText className="h-4 w-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                      <p className="text-sm whitespace-pre-wrap">{selectedQuotation.notes}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Calendar Notes Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium">Calendar Notes (Post-it)</Label>
                  {!isEditingNote && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditingNote(true)}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                
                {isEditingNote ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editingNote}
                      onChange={(e) => setEditingNote(e.target.value)}
                      placeholder="Add your notes here... (e.g., special instructions, reminders, etc.)"
                      className="min-h-[80px] resize-none"
                      maxLength={500}
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {editingNote.length}/500 characters
                      </span>
                      <div className="flex space-x-2">
                        <Button size="sm" onClick={handleSaveNote}>
                          <Save className="h-3 w-3 mr-1" />
                          Save
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => {
                            setIsEditingNote(false);
                            const existingNote = calendarNotes.find(note => note.quotation_id === selectedQuotation?.id);
                            setEditingNote(existingNote?.note_text || '');
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="min-h-[60px] p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    {(() => {
                      const calendarNote = calendarNotes.find(note => note.quotation_id === selectedQuotation.id);
                      return calendarNote ? (
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <StickyNote className="h-4 w-4 text-yellow-600 mt-0.5 mr-2" />
                            <div className="flex-1">
                              <p className="text-sm whitespace-pre-wrap">{calendarNote.note_text}</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center text-gray-400 text-sm">
                          <StickyNote className="h-4 w-4 mr-2" />
                          No calendar notes yet. Click edit to add notes.
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Assign Quotation Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">
              Assign to {selectedDate?.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Selected Date</Label>
              <p className="text-sm text-gray-600">
                {selectedDate?.toLocaleDateString('en-US', { 
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Select Quotation</Label>
              <Select value={quotationToAssign} onValueChange={setQuotationToAssign}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose quotation to assign" />
                </SelectTrigger>
                <SelectContent>
                  {availableQuotations.map(quotation => (
                    <SelectItem key={quotation.id} value={quotation.id}>
                      <div className="flex flex-col">
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {quotation.customer_name || 'N/A'}
                            </span>
                            <span className="text-xs text-gray-600">
                              Company: {quotation.company_name || 'Unknown Company'}
                            </span>
                          </div>
                          <span className={`text-xs px-1 py-0.5 rounded ${getStatusColor(quotation.status)}`}>
                            {quotation.status.toUpperCase()}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {quotation.destination} • {quotation.total_cost.toLocaleString()} THB • Created: {new Date(quotation.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                  {availableQuotations.length === 0 && (
                    <SelectItem value="none" disabled>
                      No quotations available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setShowAssignDialog(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAssignQuotation}
                disabled={!quotationToAssign || quotationToAssign === 'none'}
              >
                <Plus className="h-4 w-4 mr-2" />
                Assign
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
