'use client';
import { useState } from 'react';
import useSWR from 'swr';
import {
  Grid,
  Container,
  Card,
  CardContent,
  Typography,
  CardActionArea,
  CircularProgress,
  Box,
  List,
  ListItem,
  ListItemText,
  Button,
  Collapse,
} from '@mui/material';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function Dashboard() {
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

    console.log('Fetching submissions for assignment:', selectedCourseId, courseWorkId);
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
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Google Classroom Courses
      </Typography>

      <Grid container spacing={3}>
        {data?.courses?.map((course: any) => (
          <Grid item xs={12} sm={6} md={4} key={course.id}>
            <Card>
              <CardActionArea onClick={() => handleCardClick(course.id)}>
                <CardContent>
                  <Typography variant="h6">{course.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {course.section || 'No section'}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      {selectedCourseId && (
        <Box mt={6}>
          <Typography variant="h5" gutterBottom>
            Assignments
          </Typography>

          {loadingAssignments ? (
            <CircularProgress />
          ) : assignments.length === 0 ? (
            <Typography>No assignments found.</Typography>
          ) : (
            <List>
              {assignments.map((work: any) => (
                <Box key={work.id}>
                  <ListItem>
                    <ListItemText
                      primary={work.title}
                      secondary={work.description || 'No description'}
                    />
                    <Button onClick={() => fetchSubmissions(work.id)}>View Submissions</Button>
                  </ListItem>

                  <Collapse in={expandedAssignmentId === work.id} timeout="auto" unmountOnExit>
                    <Box ml={4} mb={2}>
                      {submissionsMap[work.id] === null ? (
                        <CircularProgress size={20} />
                      ) : submissionsMap[work.id]?.length ? (
                        <List dense>
                          {(submissionsMap[work.id]??[]).map((sub: any) => (
                            <ListItem key={sub.id}>
                              <ListItemText
                                primary={`User ID: ${sub.userId || 'Unknown'}`}
                                secondary={
                                  sub.assignmentSubmission?.attachments?.length ? (
                                    <span>
                                      {sub.assignmentSubmission.attachments.map(
                                        (a: any, i: number) => (
                                          <span key={i} style={{ display: 'block' }}>
                                            <a
                                              href={
                                                a.driveFile?.alternateLink || '#'
                                              }
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              style={{
                                                color: '#1976d2',
                                                textDecoration: 'underline',
                                              }}
                                            >
                                              {a.driveFile?.title ||
                                                a.driveFile?.id ||
                                                'Drive File'}
                                            </a>
                                          </span>
                                        )
                                      )}
                                    </span>
                                  ) : (
                                    'No attachments'
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
                </Box>
              ))}
            </List>
          )}
        </Box>
      )}
    </Container>
  );
}
