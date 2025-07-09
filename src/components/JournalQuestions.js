import React, { useRef, useLayoutEffect, useEffect, useState } from 'react';
import { useJournal } from "../JournalContext";
import { db, ref, push, onValue, set } from '../firebase';

// Journal questions configuration
const ROUND_1_QUESTIONS = [
  "Welcome to your Mission Journal, cadet! To get started, enter your codename.",
  "How many sectors are there on S.S. Astra?",
  "Look around the room, how many cadets are there in total [remember to count yourself!]?",
  "During this round you completed a task with a partner cadet, what task did you complete as a team?",
  "Write down the codename of your partner cadet for this task.",
  "Given that you know that on this ship there is a sector that is infected, do you suspect that you or your partner cadet have become infected after this round?",
  "On the top right there is an option to \"Go Dual Screen\" or \"Go Single Screen.\" How does the view change when you \"Go Dual Screen\"?",
  "Set your view to Dual Screen where the Journal and plot are side-by-side. Now, let's explore the data plots tab above. Click the \"Plot Options\" dropdown menu, how many types of data plots do you see?",
  "In the data plots section, notice how there are many variables that you can choose from. As our first plot, let's focus on analyzing one specific variable. Using the dropdown menu, pick either a histogram or a pie plot and click the box for \"Infected Cadets.\" From the plot, report how many cadets are infected.",
  "Great! What information did the plot you chose provide that helped you to answer the previous question?"
];

const ROUND_2_QUESTIONS = [
  "Report the letter of the sector (A, B, etc) you visited in this round.",
  "Write down the codename of your partner cadet for this task.",
  "Did you work with the same cadet as in Round 1? If so, why?",
  "Now that you have participated in 2 Rounds of tasks on the S.S. Astra, we urge you to start thinking about how the infection is spreading. As we are still collectively trying to fight these infections, we need your help! Without changing the rules of the game, what do you suggest the cadets should do to lessen the spread?",
  "Head back to the data plots tab. This time, let's compare two different variables using one of the scatter, line, or bar plot options from the dropdown menu. For the 'x' axis, let's click \"Time,\" and for the 'y' axis, let's click \"Infected Cadets.\" With this plot, would you say that the number of infected cadets has increased over time?",
  "What makes the scatter, line, or bar plots helpful in answering the previous question? Hint: How many variables did you click for your plot in Round 1 as compared to Round 2?"
];

const ROUND_3_QUESTIONS = [
  "Earlier in Journal 2, we asked if you stayed with the same partner for your Round 1 and 2 tasks. Did you pick a new partner (different from Round 1 AND Round 2) for this task? Do you think that changing partners might increase the chance of you getting infected? In a few words, explain your reasoning.",
  "Now, head back to the data plots tab. Similar to Round 2, we will be examining two variables at one time. You will use a line, scatter, or bar plot for this question (the choice is yours!). This time, let's keep our 'x' axis as \"Time\" but change our 'y' axis to \"Infected Sectors.\" Examine how the number of infected sectors has changed over time. Write down your observations from this plot.",
  "Lastly, change the 'x' variable to 'Meetings Held.' Once again, write down your observations for this plot.",
  "Between the two plots you looked at for Questions 18 and 19 explain what similarities you notice between the results of the plots.",
  "What type of plot do you think is most useful for trying to solve the problem of limiting infection spread throughout the S.S. Astra?"
];

// Auto-resizing textarea component
const AutoResizingTextarea = ({ value, onChange, onBlur, ...props }) => {
  const textareaRef = useRef(null);

  useLayoutEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'inherit';
      textareaRef.current.style.height = `${Math.max(textareaRef.current.scrollHeight, 50)}px`;
    }
  }, [value]);

  return <textarea ref={textareaRef} value={value} onChange={onChange} onBlur={onBlur} {...props} />;
};

// Question box component
export const QuestionBox = ({ question, index, logAction, styles = {} }) => {
  const { journalAnswers, setJournalAnswer } = useJournal();
  const answer = journalAnswers[index] || "";
  const answerRef = useRef(answer);

  useEffect(() => {
    answerRef.current = answer;
  }, [answer]);

  // Log click_on event
  const handleClickOn = () => {
    let journalNumber = 1;
    if (index >= ROUND_1_QUESTIONS.length + ROUND_2_QUESTIONS.length) journalNumber = 3;
    else if (index >= ROUND_1_QUESTIONS.length) journalNumber = 2;
    logAction && logAction('journal_entry', {
      journalNumber,
      action: 'click_on',
      questionIndex: index
    });
  };

  // Log click_off event with word count
  const handleClickOff = (e) => {
    const value = e.target.value;
    const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
    let journalNumber = 1;
    if (index >= ROUND_1_QUESTIONS.length + ROUND_2_QUESTIONS.length) journalNumber = 3;
    else if (index >= ROUND_1_QUESTIONS.length) journalNumber = 2;
    logAction && logAction('journal_entry', {
      journalNumber,
      action: 'click_off',
      questionIndex: index,
      wordCount
    });
  };

  const handleAnswerChange = (e) => {
    setJournalAnswer(index, e.target.value);
  };

  const defaultStyles = {
    questionBox: { marginBottom: '1rem' },
    questionLabel: { 
      display: 'block', 
      marginBottom: '0.5rem', 
      fontWeight: 'bold' 
    },
    textarea: {
      width: "100%",
      minHeight: '50px',
      background: "var(--cream-panel)",
      color: "var(--text-dark)",
      border: "1px solid var(--panel-border)",
      borderRadius: "4px",
      padding: "0.5rem",
      resize: "none",
      boxSizing: 'border-box',
      margin: 0,
    }
  };

  const mergedStyles = {
    questionBox: { ...defaultStyles.questionBox, ...styles.questionBox },
    questionLabel: { ...defaultStyles.questionLabel, ...styles.questionLabel },
    textarea: { ...defaultStyles.textarea, ...styles.textarea }
  };

  return (
    <div style={mergedStyles.questionBox}>
      <label style={mergedStyles.questionLabel}>
        {question}
      </label>
      <AutoResizingTextarea
        placeholder="Your answer..."
        value={answer}
        onChange={handleAnswerChange}
        onBlur={handleClickOff}
        onFocus={handleClickOn}
        style={mergedStyles.textarea}
      />
    </div>
  );
};

// Main journal questions component
export const JournalQuestions = ({ logAction, styles = {} }) => {
  const round1Offset = 0;
  const round2Offset = ROUND_1_QUESTIONS.length;
  const round3Offset = ROUND_1_QUESTIONS.length + ROUND_2_QUESTIONS.length;
  const { journalAnswers } = useJournal();

  // Get current sessionId from Firebase
  const [sessionId, setSessionId] = useState("");
  useEffect(() => {
    const sessionIdRef = ref(db, 'activeSessionId');
    const unsubscribe = onValue(sessionIdRef, (snapshot) => {
      setSessionId(snapshot.val() || "");
    });
    return () => unsubscribe();
  }, []);

  // Helper to sanitize keys for Firebase paths
  const sanitizeForFirebase = (str) => (str || '').replace(/[.#$\[\]:/]/g, '_');

  const studentId = sanitizeForFirebase(localStorage.getItem('selectedPlayer') || 'unknown');

  // Helper to submit a round's answers
  const handleSubmitRound = async (round, offset, questions) => {
    if (!sessionId || !studentId) return;
    // Sanitize all dynamic keys for Firebase path
    const safeSessionId = sanitizeForFirebase(sessionId);
    const safeStudentId = sanitizeForFirebase(studentId);
    const rawTimestamp = new Date().toISOString();
    const timestamp = sanitizeForFirebase(rawTimestamp);
    // Build answers object: { questionNumber: answer, ... }
    const answers = {};
    let answeredCount = 0;
    let totalWords = 0;
    questions.forEach((q, i) => {
      const ans = journalAnswers[offset + i] || "";
      answers[offset + i + 1] = ans;
      if (ans.trim()) {
        answeredCount++;
        totalWords += ans.trim().split(/\s+/).length;
      }
    });
    // Save as a flat object under: sessions/{safeSessionId}/JournalEntries/{safeStudentId}/Journal{round}_{timestamp}
    await set(ref(db, `sessions/${safeSessionId}/JournalEntries/${safeStudentId}/Journal${round}_${timestamp}`), {
      round,
      timestamp: rawTimestamp,
      answers
    });
    // Log journal submit action
    logAction && logAction('journal_entry', {
      journalNumber: round,
      action: 'submit',
      answeredCount,
      totalQuestions: questions.length,
      totalWords
    });
  };

  // Styling for visual hierarchy
  const mainTitleStyle = {
    fontSize: '2.2rem',
    fontWeight: 'bold',
    marginBottom: '2.5rem',
    textAlign: 'center',
  };
  const roundSectionStyle = {
    marginBottom: '3rem',
  };
  const roundHeaderStyle = {
    fontSize: '1.5rem',
    fontWeight: 700,
    marginBottom: '1rem',
    marginTop: 0,
  };
  const instructionStyle = {
    fontSize: '1.1rem',
    marginBottom: '1.5rem',
  };
  const questionBoxSpacing = {
    marginBottom: '1.5rem',
  };

  return (
    <div>
      <div style={mainTitleStyle}>Alien Invasion Mission Journal - Simulation 1</div>

      {/* Round 1 */}
      <div style={roundSectionStyle}>
        <h4 style={roundHeaderStyle}>Round 1 Questions</h4>
        <div style={instructionStyle}>Answer the following questions in Journal 1 after finishing your first task!<br/>Journal #1:</div>
        {ROUND_1_QUESTIONS.map((question, index) => (
          <div style={questionBoxSpacing} key={`r1-wrap${index}`}>
            <QuestionBox 
              key={`r1-q${index}`} 
              question={question} 
              index={round1Offset + index} 
              logAction={logAction}
              styles={styles}
            />
          </div>
        ))}
        <button onClick={() => handleSubmitRound(1, round1Offset, ROUND_1_QUESTIONS)} style={{marginTop: 16, fontWeight: 700, fontSize: 18, padding: '10px 24px', borderRadius: 8, background: '#43d675', color: '#fff', border: 'none', cursor: 'pointer'}}>Submit</button>
      </div>

      {/* Round 2 */}
      <div style={roundSectionStyle}>
        <h4 style={roundHeaderStyle}>Round 2 Questions</h4>
        <div style={instructionStyle}>Answer the following questions in Journal 2 after finishing your second task!<br/>Journal #2:</div>
        {ROUND_2_QUESTIONS.map((question, index) => (
          <div style={questionBoxSpacing} key={`r2-wrap${index}`}>
            <QuestionBox 
              key={`r2-q${index}`} 
              question={question} 
              index={round2Offset + index} 
              logAction={logAction}
              styles={styles}
            />
          </div>
        ))}
        <button onClick={() => handleSubmitRound(2, round2Offset, ROUND_2_QUESTIONS)} style={{marginTop: 16, fontWeight: 700, fontSize: 18, padding: '10px 24px', borderRadius: 8, background: '#43d675', color: '#fff', border: 'none', cursor: 'pointer'}}>Submit</button>
      </div>

      {/* Round 3 */}
      <div style={roundSectionStyle}>
        <h4 style={roundHeaderStyle}>Round 3 Questions</h4>
        <div style={instructionStyle}>Congrats, Cadet! You are now on your last stretch of your Mission Journal, you're almost there. Answer the following questions in Journal 3 after finishing your third task!</div>
        {ROUND_3_QUESTIONS.map((question, index) => (
          <div style={questionBoxSpacing} key={`r3-wrap${index}`}>
            <QuestionBox 
              key={`r3-q${index}`} 
              question={question} 
              index={round3Offset + index} 
              logAction={logAction}
              styles={styles}
            />
          </div>
        ))}
        <button onClick={() => handleSubmitRound(3, round3Offset, ROUND_3_QUESTIONS)} style={{marginTop: 16, fontWeight: 700, fontSize: 18, padding: '10px 24px', borderRadius: 8, background: '#43d675', color: '#fff', border: 'none', cursor: 'pointer'}}>Submit</button>
      </div>
    </div>
  );
};

export default JournalQuestions; 