import { useMemo } from 'react';
import { useTraining } from '@/context/TrainingContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { BookOpen, CalendarCheck, Users, TrendingUp, Clock, CheckCircle2, XCircle, AlertCircle, UserCheck } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { safeDate } from '@/lib/dateUtils';

export function AdminDashboard() {
  const { trainings, registrations, categories } = useTraining();

  // Basic stats
  const totalTrainings = trainings.length;
  const scheduledTrainings = trainings.filter((t) => t.status === 'Scheduled' || t.status === 'Rescheduled').length;
  const completedTrainings = trainings.filter((t) => t.status === 'Completed').length;
  const inProgressTrainings = trainings.filter((t) => t.status === 'In Progress').length;
  const cancelledTrainings = trainings.filter((t) => t.status === 'Cancelled').length;
  const onHoldTrainings = trainings.filter((t) => t.status === 'On Hold').length;
  const totalRegistrations = registrations.length;

  // Calculate total capacity and fill rate
  const totalCapacity = trainings.reduce((sum, t) => sum + t.maxRegistrations, 0);
  const totalEnrolled = trainings.reduce((sum, t) => sum + (t.maxRegistrations - t.availableSlots), 0);
  const overallFillRate = totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0;

  // Category distribution data
  const categoryData = useMemo(() => {
    const categoryMap = new Map<string, { count: number; color: string; name: string }>();
    
    trainings.forEach((training) => {
      const category = categories.find((c) => c.id === training.categoryId);
      if (category) {
        const existing = categoryMap.get(category.id);
        if (existing) {
          existing.count++;
        } else {
          categoryMap.set(category.id, { count: 1, color: category.color, name: category.name });
        }
      }
    });

    return Array.from(categoryMap.values()).map((item) => ({
      name: item.name,
      value: item.count,
      fill: item.color,
      percentage: Math.round((item.count / totalTrainings) * 100),
    }));
  }, [trainings, categories, totalTrainings]);

  // Training status data for bar chart
  const statusData = useMemo(() => [
    { name: 'Scheduled', value: scheduledTrainings, fill: 'hsl(var(--primary))' },
    { name: 'In Progress', value: inProgressTrainings, fill: 'hsl(173, 58%, 39%)' },
    { name: 'Completed', value: completedTrainings, fill: 'hsl(142, 76%, 36%)' },
    { name: 'On Hold', value: onHoldTrainings, fill: 'hsl(45, 93%, 47%)' },
    { name: 'Cancelled', value: cancelledTrainings, fill: 'hsl(0, 84%, 60%)' },
  ], [scheduledTrainings, inProgressTrainings, completedTrainings, onHoldTrainings, cancelledTrainings]);

  // Enrollments over time (last 6 months)
  const enrollmentTrend = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(new Date(), i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      
      const monthRegistrations = registrations.filter((r) => {
        const regDate = safeDate(r.registeredAt);
        return isWithinInterval(regDate, { start: monthStart, end: monthEnd });
      }).length;

      const monthTrainings = trainings.filter((t) => {
        const trainingDate = safeDate(t.date);
        return isWithinInterval(trainingDate, { start: monthStart, end: monthEnd });
      }).length;

      months.push({
        month: format(monthDate, 'MMM'),
        registrations: monthRegistrations,
        trainings: monthTrainings,
      });
    }
    return months;
  }, [registrations, trainings]);

  // Top trainings by enrollment
  const topTrainings = useMemo(() => {
    return trainings
      .map((training) => ({
        name: training.name.length > 25 ? training.name.substring(0, 25) + '...' : training.name,
        fullName: training.name,
        enrolled: training.maxRegistrations - training.availableSlots,
        capacity: training.maxRegistrations,
        fillRate: Math.round(((training.maxRegistrations - training.availableSlots) / training.maxRegistrations) * 100),
      }))
      .sort((a, b) => b.enrolled - a.enrolled)
      .slice(0, 5);
  }, [trainings]);

  // Chart configs
  const categoryChartConfig = useMemo(() => {
    const config: Record<string, { label: string; color: string }> = {};
    categoryData.forEach((cat) => {
      config[cat.name] = { label: cat.name, color: cat.fill };
    });
    return config;
  }, [categoryData]);

  const trendChartConfig = {
    registrations: { label: 'Registrations', color: 'hsl(var(--primary))' },
    trainings: { label: 'Trainings', color: 'hsl(var(--muted-foreground))' },
  };

  const statusChartConfig = {
    value: { label: 'Count' },
  };

  // KPI cards data
  const kpiCards = [
    {
      title: 'Total Trainings',
      value: totalTrainings,
      icon: <BookOpen className="h-5 w-5" />,
      description: `${categories.length} categories`,
      color: 'bg-primary/10 text-primary',
    },
    {
      title: 'Scheduled',
      value: scheduledTrainings,
      icon: <CalendarCheck className="h-5 w-5" />,
      description: `${inProgressTrainings} in progress`,
      color: 'bg-blue-500/10 text-blue-600',
    },
    {
      title: 'Completed',
      value: completedTrainings,
      icon: <CheckCircle2 className="h-5 w-5" />,
      description: `${Math.round((completedTrainings / Math.max(totalTrainings, 1)) * 100)}% completion rate`,
      color: 'bg-green-500/10 text-green-600',
    },
    {
      title: 'Cancelled',
      value: cancelledTrainings,
      icon: <XCircle className="h-5 w-5" />,
      description: `${onHoldTrainings} on hold`,
      color: 'bg-red-500/10 text-red-600',
    },
    {
      title: 'Total Registrations',
      value: totalRegistrations,
      icon: <Users className="h-5 w-5" />,
      description: 'All trainings',
      color: 'bg-purple-500/10 text-purple-600',
    },
    {
      title: 'Capacity Fill Rate',
      value: `${overallFillRate}%`,
      icon: <UserCheck className="h-5 w-5" />,
      description: `${totalEnrolled} of ${totalCapacity} slots`,
      color: 'bg-amber-500/10 text-amber-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpiCards.map((kpi, index) => (
          <Card key={index} className="border-2 hover:shadow-md transition-shadow">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-2 rounded-lg ${kpi.color}`}>
                  {kpi.icon}
                </div>
              </div>
              <p className="text-2xl font-bold">{kpi.value}</p>
              <p className="text-xs font-medium text-muted-foreground">{kpi.title}</p>
              <p className="text-xs text-muted-foreground/70 mt-1">{kpi.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row 1: Category Distribution & Training Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution Pie Chart */}
        <Card className="border-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Training Categories</CardTitle>
            <CardDescription>Distribution by category</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <ChartContainer config={categoryChartConfig} className="h-[280px] w-full">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percentage }) => `${percentage}%`}
                    labelLine={false}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} stroke="hsl(var(--background))" strokeWidth={2} />
                    ))}
                  </Pie>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value, name) => (
                          <div className="flex items-center gap-2">
                            <span>{name}:</span>
                            <span className="font-bold">{value} trainings</span>
                          </div>
                        )}
                      />
                    }
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                </PieChart>
              </ChartContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                No category data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Training Status Bar Chart */}
        <Card className="border-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Training Status Overview</CardTitle>
            <CardDescription>Current status distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={statusChartConfig} className="h-[280px] w-full">
              <BarChart data={statusData} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                <XAxis type="number" tickLine={false} axisLine={false} />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  tickLine={false} 
                  axisLine={false}
                  width={80}
                  tick={{ fontSize: 12 }}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, name) => (
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{value} trainings</span>
                        </div>
                      )}
                    />
                  }
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2: Enrollment Trend & Top Trainings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enrollment Trend Line Chart */}
        <Card className="border-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Enrollment Trend</CardTitle>
            <CardDescription>Registrations & trainings over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={trendChartConfig} className="h-[280px] w-full">
              <LineChart data={enrollmentTrend} margin={{ left: 12, right: 12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="month" 
                  tickLine={false} 
                  axisLine={false}
                  tick={{ fontSize: 12 }}
                />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Line 
                  type="monotone" 
                  dataKey="registrations" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="trainings" 
                  stroke="hsl(var(--muted-foreground))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--muted-foreground))', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Top Trainings by Enrollment */}
        <Card className="border-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Top Trainings by Enrollment
            </CardTitle>
            <CardDescription>Most popular trainings ranked by registrations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topTrainings.length > 0 ? (
                topTrainings.map((training, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <span className="text-lg font-bold text-muted-foreground w-6">
                      #{index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium truncate" title={training.fullName}>
                          {training.name}
                        </p>
                        <span className="text-xs text-muted-foreground ml-2">
                          {training.enrolled}/{training.capacity}
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{ width: `${training.fillRate}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-primary w-12 text-right">
                      {training.fillRate}%
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No training data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-2 bg-gradient-to-br from-blue-500/10 to-blue-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/20 rounded-xl">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-3xl font-bold">{scheduledTrainings + inProgressTrainings}</p>
                <p className="text-sm font-medium text-muted-foreground">Active Trainings</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 bg-gradient-to-br from-green-500/10 to-green-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/20 rounded-xl">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-3xl font-bold">{Math.round((completedTrainings / Math.max(totalTrainings, 1)) * 100)}%</p>
                <p className="text-sm font-medium text-muted-foreground">Completion Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 bg-gradient-to-br from-amber-500/10 to-amber-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-500/20 rounded-xl">
                <AlertCircle className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-3xl font-bold">{onHoldTrainings}</p>
                <p className="text-sm font-medium text-muted-foreground">On Hold</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 bg-gradient-to-br from-purple-500/10 to-purple-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500/20 rounded-xl">
                <UserCheck className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-3xl font-bold">{totalEnrolled}</p>
                <p className="text-sm font-medium text-muted-foreground">Total Enrolled</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
