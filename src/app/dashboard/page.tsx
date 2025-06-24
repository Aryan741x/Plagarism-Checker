'use client';
import { useState } from 'react';
import useSWR from 'swr';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  CardActionArea,
  CircularProgress,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Divider,
  Collapse,
  Button,
  ListItemButton,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AssignmentIcon from '@mui/icons-material/Assignment';
import FolderIcon from '@mui/icons-material/Folder';
import { useRouter } from 'next/navigation';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function Dashboard() {
  const router = useRouter();
  const { data, error, isLoading } = useSWR('/api/classroom/courses', fetcher);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [submissionsMap, setSubmissionsMap] = useState<{ [key: string]: any[] | null }>({});
  const [expandedAssignmentId, setExpandedAssignmentId] = useState<string | null>(null);

  const handleCardClick = async (courseId: string) => {
    setSelectedCourseId(courseId);
    setLoadingAssignments(true);
    setSubmissionsMap({});
    setExpandedAssignmentId(null);

    try {
      const res = await fetch(`/api/classroom/courses?courseId=${courseId}`);
      const json = await res.json();
      setAssignments(json.courseWork || []);
    } catch (err) {
      console.error('Error fetching assignments:', err);
    }

    setLoadingAssignments(false);
  };

  const fetchSubmissions = async (courseWorkId: string) => {
    if (!selectedCourseId || !courseWorkId) return;

    setSubmissionsMap(prev => ({ ...prev, [courseWorkId]: null }));
    setExpandedAssignmentId(courseWorkId);

    try {
      const res = await fetch(
        `/api/classroom/submissions?courseId=${selectedCourseId}&courseWorkId=${courseWorkId}`
      );
      const json = await res.json();
      setSubmissionsMap(prev => ({
        ...prev,
        [courseWorkId]: json.studentSubmissions || [],
      }));
    } catch (err) {
      console.error('Error fetching submissions:', err);
      setSubmissionsMap(prev => ({ ...prev, [courseWorkId]: [] }));
    }
  };

  if (isLoading) {
    return (
      <Box p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4}>
        <Typography color="error">Failed to load courses.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', bgcolor: '#e3f2fd', minHeight: '100vh' }}>
      {/* Sidebar Drawer */}
      <Drawer variant="permanent" sx={{ width: 240, flexShrink: 0 }}>
        <Box sx={{ width: 240, bgcolor: '#ffffff', height: '100vh', borderRight: '1px solid #ccc' }}>
          <Box p={2}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Classroom
            </Typography>
          </Box>
          <Divider />
          <List>
            <ListItemButton selected>
              <ListItemIcon><HomeIcon /></ListItemIcon>
              <ListItemText primary="Home" />
            </ListItemButton>
            <ListItemButton onClick={() => router.push('/calendar')}>
              <ListItemIcon><CalendarTodayIcon /></ListItemIcon>
              <ListItemText primary="Calendar" />
            </ListItemButton>
            <ListItem>
              <ListItemText primary="Enrolled" />
            </ListItem>
            {data?.courses?.map((course: any) => (
              <ListItemButton key={course.id} onClick={() => handleCardClick(course.id)}>
                <ListItemIcon>
                  <Avatar sx={{ width: 24, height: 24 }}>
                    {course.name?.charAt(0) || 'C'}
                  </Avatar>
                </ListItemIcon>
                <ListItemText primary={course.name} />
              </ListItemButton>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Container maxWidth="lg">
          <Typography variant="h4" gutterBottom>
            Google Classroom Courses
          </Typography>

          {selectedCourseId && (
            <Box mb={2}>
              <Button variant="outlined" onClick={() => setSelectedCourseId(null)}>
                ← Back to Courses
              </Button>
            </Box>
          )}

          {/* Course Grid */}
          {!selectedCourseId && (
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 3,
                justifyContent: 'flex-start',
              }}
            >
              {data?.courses?.map((course: any) => (
                <Box
                  key={course.id}
                  sx={{
                    width: '240px',
                    transition: '0.3s',
                    '&:hover': {
                      transform: 'scale(1.03)',
                    },
                  }}
                >
                  <Card
                    sx={{
                      borderRadius: 3,
                      boxShadow: 4,
                      height: '100%',
                      backgroundColor: '#ffffff',
                    }}
                  >
                    <CardActionArea onClick={() => handleCardClick(course.id)}>
                      <Box
                        sx={{
                          background: 'linear-gradient(to right, #1976d2, #2196f3)',
                          color: 'white',
                          p: 2,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          height: 100,
                        }}
                      >
                        <Box>
                          <Typography variant="h6">{course.name}</Typography>
                          <Typography variant="caption">{course.section || 'No section'}</Typography>
                        </Box>
                        <Avatar>{course.name?.charAt(0) || 'C'}</Avatar>
                      </Box>
                      <CardContent sx={{ minHeight: 40 }} />
                      <Box
                        sx={{
                          px: 2,
                          pb: 1,
                          display: 'flex',
                          justifyContent: 'space-between',
                          color: '#9e9e9e',
                        }}
                      >
                        <AssignmentIcon fontSize="small" />
                        <FolderIcon fontSize="small" />
                      </Box>
                    </CardActionArea>
                  </Card>
                </Box>
              ))}
            </Box>
          )}

          {/* Assignments Section */}
          {selectedCourseId && (
            <Box mt={4}>
              <Typography variant="h5" gutterBottom>
                Assignments
              </Typography>

              {loadingAssignments ? (
                <CircularProgress />
              ) : assignments.length === 0 ? (
                <Typography>No assignments found.</Typography>
              ) : (
                assignments.map(work => (
                  <Box key={work.id} mb={2}>
                    <Card variant='outlined'>
                      <ListItem
                        secondaryAction={
                          <Button onClick={() => fetchSubmissions(work.id)}>View Submissions</Button>
                        }
                      >
                        <ListItemText
                          primary={work.title}
                          secondary={work.description || 'No description'}
                        />
                      </ListItem>
                      <Collapse in={expandedAssignmentId === work.id} timeout="auto" unmountOnExit>
                        <Box ml={4} mb={2}>
                          {submissionsMap[work.id] === null ? (
                            <CircularProgress size={20} />
                          ) : submissionsMap[work.id]?.length ? (
                            <List dense>
                              {(submissionsMap[work.id] ?? []).map((sub: any) => (
                                <ListItem key={sub.id} alignItems="flex-start">
                                  <ListItemText
                                    primary={`User ID: ${sub.userId || 'Unknown'}`}
                                    secondary={
                                      sub.assignmentSubmission?.attachments?.length ? (
                                        <Box>
                                          <Typography variant="body2" gutterBottom>
                                            Attachments:
                                          </Typography>
                                          {sub.assignmentSubmission.attachments.map((a: any, i: number) => (
                                            <Typography
                                              key={i}
                                              component="div"
                                              sx={{ ml: 1, fontSize: '0.85rem' }}
                                            >
                                              <a
                                                href={a.driveFile?.alternateLink || '#'}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{ color: '#1976d2', textDecoration: 'underline' }}
                                              >
                                                {a.driveFile?.title || a.driveFile?.id || 'Drive File'}
                                              </a>
                                            </Typography>
                                          ))}

                                          {/* Action Buttons */}
                                          <Box mt={1} display="flex" gap={1}>
                                            <Button
                                              size="small"
                                              variant="contained"
                                              color="primary"
                                              disabled={!sub.assignmentSubmission.attachments?.[0]?.driveFile?.alternateLink}
                                              href={sub.assignmentSubmission.attachments?.[0]?.driveFile?.alternateLink}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              startIcon={<span className="material-icons"></span>}
                                            >
                                              Open Submission
                                            </Button>
                                            <Button
                                              size="small"
                                              variant="outlined"
                                              color="secondary"
                                              disabled={!sub.assignmentSubmission.attachments?.length}
                                              onClick={() => {
                                                sub.assignmentSubmission.attachments.forEach((a: any) => {
                                                  if (a.driveFile?.alternateLink) {
                                                    window.open(a.driveFile.alternateLink, '_blank');
                                                  }
                                                });
                                              }}
                                              startIcon={<span className="material-icons"></span>}
                                            >
                                             Download 
                                            </Button>
                                          </Box>
                                        </Box>
                                      ) : (
                                        <Typography variant="body2">No attachments</Typography>
                                      )
                                    }
                                  />
                                </ListItem>
                              ))}
                            </List>
                          ) : (
                            <Typography variant="body2">No submissions found.</Typography>
                          )}
                        </Box>
                      </Collapse>

                    </Card>
                  </Box>
                ))
              )}
            </Box>
          )}
        </Container>
      </Box>
    </Box>
  );
}
