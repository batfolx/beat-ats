import React, { useState } from "react";
import {
  TextField,
  Button,
  Typography,
  Box,
  Paper,
  Snackbar,
  Alert,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import DownloadIcon from "@mui/icons-material/Download";
import { PDFDocument, rgb } from "pdf-lib";

type FileType = File | null;

const PDFModifier: React.FC = () => {
  const [jobPostingText, setJobPostingText] = useState<string>("");
  const [resumeFile, setResumeFile] = useState<FileType>(null);
  const [outputFileName, setOutputFileName] = useState<string>("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastSeverity, setToastSeverity] = useState<"success" | "error">(
    "success",
  );

  const handlePDFUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setResumeFile(file);
      const fileNameWithoutExtension = file.name.replace(/\.[^/.]+$/, "");
      setOutputFileName(`${fileNameWithoutExtension}Updated.pdf`);
    }
  };

  const cleanJobPostingText = (text: string) => {
    return text.replace(/[^\u0020-\u007E]/g, "");
  };

  const createTransparentOverlay = async (
    text: string,
    pageSize: { width: number; height: number },
  ) => {
    const overlayPdfDoc = await PDFDocument.create();
    const page = overlayPdfDoc.addPage([pageSize.width, pageSize.height]);
    const { height } = page.getSize();
    const textSize = 12;
    const lines = text.split("\n");
    let yPosition = height - 50;

    lines.forEach((line) => {
      page.drawText(line, {
        x: 50,
        y: yPosition,
        size: textSize,
        color: rgb(0.001, 0.8, 0.8),
        opacity: 0.001,
      });
      yPosition -= textSize + 5;
    });

    return overlayPdfDoc;
  };

  const handleProcess = async () => {
    if (!jobPostingText.trim() || !resumeFile) {
      setToastMessage(
        "Please paste the job posting text and upload the resume PDF.",
      );
      setToastSeverity("error");
      return;
    }

    try {
      const sanitizedText = cleanJobPostingText(jobPostingText);
      const resumePdfBytes = await resumeFile.arrayBuffer();
      const resumePdfDoc = await PDFDocument.load(resumePdfBytes);
      const firstPage = resumePdfDoc.getPage(0);
      const overlayPdfDoc = await createTransparentOverlay(
        sanitizedText,
        firstPage.getSize(),
      );

      const mergedPdfDoc = await PDFDocument.create();
      const resumePages = await mergedPdfDoc.copyPages(
        resumePdfDoc,
        resumePdfDoc.getPageIndices(),
      );
      const overlayPages = overlayPdfDoc.getPages();

      for (let index = 0; index < resumePages.length; index++) {
        const resumePage = resumePages[index];
        const { width, height } = resumePage.getSize();

        if (overlayPages[index]) {
          const embeddedOverlayPage = await mergedPdfDoc.embedPage(
            overlayPages[index],
          );
          resumePage.drawPage(embeddedOverlayPage, {
            x: 0,
            y: 0,
            width,
            height,
          });
        }

        mergedPdfDoc.addPage(resumePage);
      }

      const mergedPdfBytes = await mergedPdfDoc.save();
      const blob = new Blob([mergedPdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = outputFileName;
      a.click();
      URL.revokeObjectURL(url);

      setToastMessage(`Modified PDF saved as ${outputFileName}`);
      setToastSeverity("success");
    } catch (error) {
      console.error("Error merging PDFs:", error);
      setToastMessage(
        "An error occurred while merging the PDFs. Please try again.",
      );
      setToastSeverity("error");
    }
  };

  const handleCloseToast = () => {
    setToastMessage(null);
  };

  return (
    <Box sx={{ padding: 4, maxWidth: 600, margin: "0 auto" }}>
      <Typography variant="h4" gutterBottom>
        Beat ATS.
      </Typography>

      <Typography sx={{ mb: 5, mt: 5 }}>
        This tool is designed to overlay text on your resume & make it
        completely transparent to a human. However, a computer will still be
        able to read it. Use it for what you will...
      </Typography>

      <Box sx={{ marginBottom: 3 }}>
        <TextField
          label="Paste text to overlay"
          multiline
          rows={8}
          fullWidth
          variant="outlined"
          value={jobPostingText}
          onChange={(e) => setJobPostingText(e.target.value)}
          placeholder="Paste the job posting text here..."
        />
      </Box>

      <Box sx={{ marginBottom: 3 }}>
        <Paper sx={{ padding: 2 }}>
          <Button
            variant="contained"
            component="label"
            startIcon={<UploadFileIcon />}
            fullWidth
          >
            Upload Existing PDF
            <input
              type="file"
              accept=".pdf"
              hidden
              onChange={handlePDFUpload}
            />
          </Button>
          {resumeFile && (
            <Typography variant="subtitle1" sx={{ mt: 1 }}>
              Selected File: {resumeFile.name}
            </Typography>
          )}
        </Paper>
      </Box>

      <Box>
        <Button
          variant="contained"
          color="primary"
          fullWidth
          startIcon={<DownloadIcon />}
          onClick={handleProcess}
          disabled={!resumeFile || !jobPostingText.trim()}
        >
          Process and Merge PDF
        </Button>
      </Box>

      <Snackbar
        open={Boolean(toastMessage)}
        autoHideDuration={6000}
        onClose={handleCloseToast}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseToast}
          severity={toastSeverity}
          sx={{ width: "100%" }}
        >
          {toastMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PDFModifier;
