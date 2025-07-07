'use client';
import { useEffect, useState } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AssignmentIcon from '@mui/icons-material/Assignment';
import FolderIcon from '@mui/icons-material/Folder';
import { useRouter } from 'next/navigation';
import { language } from 'googleapis/build/src/apis/language';
import { file } from 'googleapis/build/src/apis/file';

const fetcher = (url: string) => fetch(url).then(res => res.json());
type PlagiarismResult = {
  source: string;
  target: string;
  similarity: number;
};

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const router = useRouter();
  const { data, error, isLoading } = useSWR('/api/classroom/courses', fetcher);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [submissionsMap, setSubmissionsMap] = useState<{ [key: string]: any[] | null }>({});
  const [expandedAssignmentId, setExpandedAssignmentId] = useState<string | null>(null);
  const [extractingId, setExtractingId] = useState<string|null>(null);
  const [extracted, setExtracted] = useState<any|null>(null);
  const [extractError, setExtractError] = useState<string|null>(null);
  const [plagLoading, setPlagLoading] = useState(false);
  const [plagError, setPlagError] = useState<string | null>(null);
  const [plagResult, setPlagResult] = useState<any | null>(null);
  const [activePlagCheckKey, setActivePlagCheckKey] = useState<string | null>(null);
  const [selectedLang, setSelectedLang] = useState<"text"|"python">("text");
  const [fileIdNameMap, setFileIdNameMap] = useState<Record<string,string>>({});
  
  const handleExtractText = async (fileId:string) =>{
    setExtractingId(fileId);
    setExtractError(null);
    try{
      const res=await fetch(`/api/drive/extract-text?fileId=${fileId}`);
      const data = await res.json();
      console.log('Extracted data:', data);
      if(!res.ok){
        throw new Error(data.error || 'Failed to extract text');
      }
      setExtracted(data);
    }
    catch(err){
      console.log('Error extracting text:', err);
      if(err instanceof Error){
        setExtractError(err.message);
      }
      else{
        setExtractError('An unknown error occurred');
      }
    }
    finally{
      setExtractingId(null);
    }
  }

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

  const runInternalPlag = async(courseId: string, courseWorkId: string) => {
      setActivePlagCheckKey(`${courseId}:${courseWorkId}`);
      setPlagLoading(true);
      setPlagError(null);
      setPlagResult(null);
      try{
        const res=await fetch(`/api/plagiarism/internal?courseId=${courseId}&courseWorkId=${courseWorkId}&language=${selectedLang}`,);
        const data = await res.json();
        if(!res.ok){
          throw new Error(data.error || 'Failed to run plagiarism check');
        }
        const idName: Record<string, string> = {};
        (data.extracted as any[]).forEach(d => { idName[d.fileId] = d.fileName ?? d.fileId; });
        setFileIdNameMap(idName);
        // console.log('Plagiarism data:', data.extracted);
        const cmpRes=await fetch('/api/plagiarism/internal/compare', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ documents: data.extracted || [], language: selectedLang }),
        });
        const cmpData = await cmpRes.json();
        if(!cmpRes.ok){
          throw new Error(cmpData.error || 'Failed to compare documents');
        }
        // console.log('Comparison result:', cmpData);
        setPlagResult(cmpData);
      }catch(err){
        console.error('Error running plagiarism check:', err);
        if(err instanceof Error){
          setPlagError(err.message);
        } else {
          setPlagError('An unknown error occurred');
        }
      }finally{
        setPlagLoading(false);
        setActivePlagCheckKey(null);
      }
  }
  const prettyName = (idString: string) => {
    const fileId=idString.split(":")[1]?.trim();
    return fileIdNameMap[fileId] || fileId || 'Unknown File';
  };

  const driveDownload= (fileId: string) => `https://drive.google.com/uc?export=download&id=${fileId}`;
  const fetchSubmissions = async (courseWorkId: string) => {
    if (!selectedCourseId || !courseWorkId) return;
    if(expandedAssignmentId === courseWorkId) {
      setExpandedAssignmentId(null);
      return;
    }

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
                      <Box
                        px={2} py={2}
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          rowGap: 1
                        }}
                      >
                        <Box>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {work.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {work.description || 'No description'}
                          </Typography>
                        </Box>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <FormControl size="small" sx={{ minWidth: 120 }}>
                              <InputLabel>Lang</InputLabel>
                              <Select
                                label="Lang"
                                value={selectedLang}
                                onChange={(e) => setSelectedLang(e.target.value as any)}
                              >
                                <MenuItem value="text">Generic Text</MenuItem>
                                <MenuItem value="python">Python</MenuItem>
                              </Select>
                            </FormControl>
                            <Button variant='text' sx={{color: '#1976d2', fontWeight: 'bold'}} onClick={() => fetchSubmissions(work.id)}>View Submissions</Button>
                            <Button
                              variant="outlined"
                              sx={{ color: '#f57c00', borderColor: '#f57c00' }}
                              disabled={activePlagCheckKey!=null}
                              onClick={() => runInternalPlag(selectedCourseId!, work.id)}
                            >
                              {activePlagCheckKey === `${selectedCourseId}:${work.id}` ? (
                                <CircularProgress size={18} />
                              ) : (
                                'Internal Plagiarism Check'
                              )}
                            </Button>
                          </Box>
                      </Box>
                      {mounted &&(<Collapse in={expandedAssignmentId === work.id} timeout="auto" unmountOnExit>
                        <Box ml={4} mb={2}>
                          {submissionsMap[work.id] === null ? (
                            <CircularProgress size={20} />
                          ) : submissionsMap[work.id]?.length ? (
                            <List dense>
                              {(submissionsMap[work.id] ?? []).map((sub: any) => (
                                <ListItem key={sub.id} alignItems="flex-start" sx={{ display: 'block' }}>
                                    <Box sx={{ flexGrow: 1 }}>
                                      <Typography variant="subtitle1">
                                        User ID: {sub.userId || 'Unknown'}
                                      </Typography>
                                      {sub.assignmentSubmission?.attachments?.length ? (
                                        <Box mt={1}>
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
                                          <Box mt={1} display="flex" gap={1} flexWrap="wrap">
                                            {/* Open link in Drive viewer */}
                                            <Button
                                              size="small"
                                              variant="contained"
                                              color="primary"
                                              disabled={!sub.assignmentSubmission.attachments?.[0]?.driveFile?.alternateLink}
                                              href={sub.assignmentSubmission.attachments?.[0]?.driveFile?.alternateLink}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                            >
                                              Open Submission
                                            </Button>

                                            {/* Bulk-download every attachment in new tabs */}
                                            <Button
                                              size="small"
                                              variant="outlined"
                                              color="secondary"
                                              disabled={!sub.assignmentSubmission.attachments?.length}
                                              onClick={() => {
                                                sub.assignmentSubmission.attachments.forEach((a: any) => {
                                                  const id = a.driveFile?.id;
                                                  if (id) window.open(driveDownload(id), '_blank');
                                                });
                                              }}
                                            >
                                              Download
                                            </Button>

                                            {/* ⭐ NEW Extract-Text button – one per attachment */}
                                            {sub.assignmentSubmission.attachments?.map((a: any, i: number) => (
                                              <Button
                                                key={`extract-${a.driveFile?.id || i}`}
                                                size="small"
                                                variant="outlined"
                                                color="info"
                                                disabled={!a.driveFile?.id}
                                                onClick={() => handleExtractText(a.driveFile.id)}
                                              >
                                                {extractingId === a.driveFile?.id ? <CircularProgress size={18} /> : 'Extract Text'}
                                              </Button>
                                            ))}
                                          </Box>
                                        </Box>
                                      ) : (
                                        <Typography variant="body2">No attachments</Typography>
                                      )}
                                    </Box>
                                </ListItem>
                              ))}
                            </List>
                          ) : (
                            <Typography variant="body2">No submissions found.</Typography>
                          )}
                        </Box>
                      </Collapse>
                      )}
                    </Card>
                  </Box>
                ))
              )}
            </Box>
          )}
        </Container>
        <Dialog
          open={Boolean(extracted) || Boolean(extractError)}
          onClose={() => { setExtracted(null); setExtractError(null); }}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {extractError ? 'Extraction Failed' : extracted?.fileName || 'Extracted Text'}
          </DialogTitle>

          <DialogContent dividers sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
            {extractError ? (
              <Alert severity="error">{extractError}</Alert>
            ) : (
              extracted?.text || 'No text found.'
            )}
          </DialogContent>

          <DialogActions>
            <Button
              onClick={() => { setExtracted(null); setExtractError(null); }}
              color="primary"
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>
        <Dialog
          open={Boolean(plagResult) || Boolean(plagError)}
          onClose={() => { setPlagResult(null); setPlagError(null); }}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Internal Plagiarism Report</DialogTitle>

          <DialogContent dividers sx={{ whiteSpace: 'pre-wrap' }}>
            {plagLoading && <CircularProgress />}
            {plagError && <Alert severity="error">{plagError}</Alert>}
            {plagResult && (
              <div>
                {plagResult.invalid?.length > 0 && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    Skipped {plagResult.invalid.length} submissions (wrong language)
                  </Alert>
                )}

                {Array.isArray(plagResult.matches) && plagResult.matches.length === 0 ? (
                  <Alert severity="success">No significant matches found 🎉</Alert>
                ) : (
                  <List dense>
                    {plagResult.matches?.map((m: PlagiarismResult, i: number) => (
                      <ListItem key={i}>
                        <ListItemText
                          primary={`Match: ${prettyName(m.source)} ↔ ${prettyName(m.target)}`}
                          secondary={`Similarity: ${(m.similarity * 100).toFixed(2)}%`}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </div>
            )}
          </DialogContent>

          <DialogActions>
            <Button onClick={() => { setPlagResult(null); setPlagError(null); }}>
              Close
            </Button>
          </DialogActions>
        </Dialog>

      </Box>
    </Box>
  );
}
