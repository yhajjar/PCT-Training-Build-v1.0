import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  Calendar, 
  Clock, 
  Users, 
  ArrowLeft, 
  ExternalLink, 
  FileText,
  Download,
  MapPin,
  ImageIcon,
  Mic,
  Target,
  Timer
} from 'lucide-react';
import { useTraining } from '@/context/TrainingContext';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { CategoryBadge } from '@/components/training/CategoryBadge';
import { StatusBadge } from '@/components/training/StatusBadge';
import { TrainingModal } from '@/components/training/TrainingModal';
import { AnimateIn } from '@/components/ui/animate-in';
import { safeDate, formatTimeRange } from '@/lib/dateUtils';
import { useState } from 'react';

const TrainingDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getTrainingById } = useTraining();
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);

  const training = id ? getTrainingById(id) : null;

  if (!training) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Training Not Found</h1>
          <p className="text-muted-foreground mb-6">The training you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </Layout>
    );
  }

  const trainingDate = safeDate(training.date);
  const slotsPercentage = training.maxRegistrations 
    ? ((training.maxRegistrations - training.availableSlots) / training.maxRegistrations) * 100
    : 50;
  
  // Registration is allowed only if explicitly open and not blocked by status/slots
  const isRegistrationOpen = training.isRegistrationOpen ?? true;
  const canRegister = isRegistrationOpen && 
    training.status !== 'Completed' && 
    training.status !== 'Cancelled' && 
    training.status !== 'On Hold' && 
    training.availableSlots > 0;

  const handleRegister = () => {
    if (training.registrationMethod === 'external' && training.externalLink) {
      window.open(training.externalLink, '_blank', 'noopener,noreferrer');
    } else {
      setShowRegistrationModal(true);
    }
  };

  const handleDownloadAttachment = (attachment: { name: string; fileUrl: string; fileType: string }) => {
    // For cloud storage URLs, open in new tab or trigger download
    if (attachment.fileUrl.startsWith('http')) {
      window.open(attachment.fileUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative min-h-[400px] flex items-end">
        {/* Background Image */}
        <div className="absolute inset-0">
          {training.heroImage ? (
            <img
              src={training.heroImage}
              alt={training.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <ImageIcon className="h-24 w-24 text-primary/20" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative container mx-auto px-4 py-8">
          <AnimateIn>
            <Button 
              variant="ghost" 
              onClick={() => navigate(-1)}
              className="mb-6 text-foreground hover:bg-background/50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

            <div className="flex flex-wrap gap-3 mb-4">
              <CategoryBadge categoryId={training.categoryId} className="bg-background/90 backdrop-blur-sm" />
              <StatusBadge status={training.status} className="bg-background/90 backdrop-blur-sm" />
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 max-w-4xl">
              {training.name}
            </h1>

            {training.shortDescription && (
              <p className="text-lg text-muted-foreground max-w-2xl">
                {training.shortDescription}
              </p>
            )}
          </AnimateIn>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Details */}
            <div className="lg:col-span-2 space-y-8">
              {/* Description */}
              <AnimateIn>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      About This Training
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {training.description || 'No detailed description available for this training.'}
                    </p>
                  </CardContent>
                </Card>
              </AnimateIn>

              {/* Attachments */}
              {training.attachments && training.attachments.length > 0 && (
                <AnimateIn delay={100}>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Download className="h-5 w-5 text-primary" />
                        Attachments & Resources
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {training.attachments.map((attachment) => (
                          <div
                            key={attachment.id}
                            className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
                            onClick={() => handleDownloadAttachment(attachment)}
                          >
                            <div className="p-2 bg-primary/10 rounded-lg">
                              <FileText className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{attachment.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {attachment.fileType.toUpperCase()}
                              </p>
                            </div>
                            <Download className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </AnimateIn>
              )}
            </div>

            {/* Right Column - Registration Card */}
            <div className="lg:col-span-1">
              <AnimateIn delay={150}>
                <Card className="sticky top-24">
                  <CardHeader>
                    <CardTitle>Training Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Date */}
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Date</p>
                        <p className="text-muted-foreground">
                          {format(trainingDate, 'EEEE, MMMM d, yyyy')}
                          {training.endDate && safeDate(training.endDate).getTime() !== trainingDate.getTime() && 
                            ` - ${format(safeDate(training.endDate), 'MMMM d, yyyy')}`
                          }
                        </p>
                      </div>
                    </div>

                    {/* Time */}
                    {(training.timeFrom || training.timeTo) && (
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Clock className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Time</p>
                          <p className="text-muted-foreground">{formatTimeRange(training.timeFrom, training.timeTo)}</p>
                        </div>
                      </div>
                    )}

                    {/* Duration */}
                    {training.duration && (
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Timer className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Duration</p>
                          <p className="text-muted-foreground">{training.duration}</p>
                        </div>
                      </div>
                    )}

                    {/* Location */}
                    {training.location && (
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <MapPin className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Location</p>
                          <p className="text-muted-foreground">{training.location}</p>
                        </div>
                      </div>
                    )}

                    {/* Speakers */}
                    {training.speakers && (
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Mic className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Speaker(s)</p>
                          <p className="text-muted-foreground">{training.speakers}</p>
                        </div>
                      </div>
                    )}

                    {/* Target Audience */}
                    {training.targetAudience && (
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Target className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Target Audience</p>
                          <p className="text-muted-foreground">{training.targetAudience}</p>
                        </div>
                      </div>
                    )}

                    <Separator />

                    {/* Slots */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-primary" />
                          <span className="font-medium text-sm">Available Slots</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {training.availableSlots} / {training.maxRegistrations}
                        </span>
                      </div>
                      <Progress value={slotsPercentage} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">
                        {Math.round(slotsPercentage)}% filled
                      </p>
                    </div>

                    <Separator />

                    {/* Registration Button */}
                    <Button 
                      className="w-full" 
                      size="lg"
                      onClick={handleRegister}
                      disabled={!canRegister}
                    >
                      {training.registrationMethod === 'external' ? (
                        <>
                          Register Now
                          <ExternalLink className="h-4 w-4 ml-2" />
                        </>
                      ) : (
                        'Register Now'
                      )}
                    </Button>

                    {!isRegistrationOpen && training.status !== 'Completed' && training.status !== 'Cancelled' && (
                      <p className="text-sm text-center text-destructive">
                        Registration is currently closed
                      </p>
                    )}

                    {training.status === 'Completed' && (
                      <p className="text-sm text-center text-muted-foreground">
                        This training has been completed
                      </p>
                    )}

                    {training.status === 'Cancelled' && (
                      <p className="text-sm text-center text-destructive">
                        This training has been cancelled
                      </p>
                    )}

                    {training.status === 'On Hold' && (
                      <p className="text-sm text-center text-muted-foreground">
                        This training is currently on hold
                      </p>
                    )}

                    {training.availableSlots <= 0 && isRegistrationOpen && training.status !== 'Completed' && training.status !== 'Cancelled' && (
                      <p className="text-sm text-center text-muted-foreground">
                        This training is fully booked
                      </p>
                    )}
                  </CardContent>
                </Card>
              </AnimateIn>
            </div>
          </div>
        </div>
      </section>

      {/* Registration Modal */}
      {showRegistrationModal && (
        <TrainingModal
          training={training}
          onClose={() => setShowRegistrationModal(false)}
        />
      )}
    </Layout>
  );
};

export default TrainingDetailPage;
