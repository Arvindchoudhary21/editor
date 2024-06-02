import React, { useEffect, useRef, useState } from 'react';
import Codemirror from 'codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/dracula.css';
import 'codemirror/theme/3024-day.css';
import 'codemirror/theme/3024-night.css';
import 'codemirror/theme/eclipse.css';
import 'codemirror/theme/material.css';
import 'codemirror/theme/rubyblue.css';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/python/python';
import 'codemirror/mode/xml/xml';
import 'codemirror/mode/clike/clike';
import 'codemirror/mode/css/css';
import 'codemirror/addon/edit/closetag';
import 'codemirror/addon/edit/closebrackets';
import 'codemirror/addon/edit/matchbrackets';
import 'codemirror/addon/edit/matchtags';
import 'codemirror/addon/edit/trailingspace';
import 'codemirror/addon/display/placeholder';
import 'codemirror/addon/selection/active-line';
import ACTIONS from '../Actions';
import toast from 'react-hot-toast';

const Editor = ({ socketRef, roomId, onCodeChange }) => {
  const editorRef = useRef(null);
  const currentLineRef = useRef(null); // Ref to store the current line number
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [Lang, setLang] = useState('python');

  const modeOptions = {
    javascript: { name: 'javascript', json: true },
    python: { name: 'python' },
    cplusplus: { name: 'text/x-c++src' },
    java: { name: 'text/x-java' },
    xml: { name: 'xml' },
  };
  const themeOptions = [
    'dracula',
    '3024-day',
    '3024-night',
    'eclipse',
    'material',
    'rubyblue',
  ];

  function toggleComment(editor) {
    editor.operation(function () {
      var selections = editor.listSelections();
      for (var i = 0; i < selections.length; i++) {
        var from = selections[i].from().line;
        var to = selections[i].to().line;
        for (var j = from; j <= to; j++) {
          var line = editor.getLine(j);
          if (line.trim().startsWith('//')) {
            editor.replaceRange(line.replace('//', ''), { line: j, ch: 0 }, { line: j, ch: line.length });
          } else {
            editor.replaceRange('//' + line, { line: j, ch: 0 }, { line: j, ch: line.length });
          }
        }
      }
    });
  }

  useEffect(() => {
    async function init() {
      editorRef.current = Codemirror.fromTextArea(
        document.getElementById('realtimeEditor'),
        {
          mode: modeOptions.javascript,
          theme: 'dracula',
          autoCloseTags: true,
          autoCloseBrackets: true,
          autoCloseTags: true,
          matchBrackets: true,
          matchTags: true,
          showTrailingSpace: true,
          styleActiveLine: true,
          // placeholder: 'Enter your code here...',
          extraKeys: {
            'Ctrl-/': function (cm) {
              toggleComment(cm);
            }
          },
          lineNumbers: true,
        }
      );

      editorRef.current.on('change', (instance, changes) => {
        const { origin } = changes;
        const code = instance.getValue();
        onCodeChange(code);
        if (origin !== 'setValue') {
          socketRef.current.emit(ACTIONS.CODE_CHANGE, {
            roomId,
            code,
          });
        }
      });

      editorRef.current.on('cursorActivity', (instance) => {
        const cursor = instance.getCursor();
        currentLineRef.current = cursor.line; // Update the current line ref
        socketRef.current.emit(ACTIONS.CURSOR_CHANGE, {
          roomId,
          cursor,
        });
      });
    }
    init();
  }, []);

  useEffect(() => {
    if (socketRef.current) {
      socketRef.current.on(ACTIONS.CODE_CHANGE, ({ code }) => {
        if (code !== null) {
          // Save the current cursor position
          const cursor = editorRef.current.getCursor();
          // Save the current scroll position
          const scrollInfo = editorRef.current.getScrollInfo();
          // Update the editor content
          editorRef.current.setValue(code);
          // Restore the cursor position
          editorRef.current.setCursor(cursor);
          // Restore the scroll position
          editorRef.current.scrollTo(scrollInfo.left, scrollInfo.top);
        }
      });

      socketRef.current.on(ACTIONS.CURSOR_CHANGE, ({ socketId, cursor }) => {
        if (socketId !== socketRef.current.id) {
          console.log(`my ${currentLineRef.current} and your ${cursor.line}`);
          if (currentLineRef.current === cursor.line) {
            toast.success("This line already is in use.")
          }
        }
      });
    }
  
    return () => {
      socketRef.current.off(ACTIONS.CODE_CHANGE);
      socketRef.current.off(ACTIONS.CURSOR_CHANGE);
    };
  }, [socketRef.current, currentLineRef.current]);

  const handleModeChange = (e) => {
    const mode = e.target.value;
    editorRef.current.setOption('mode', modeOptions[mode]);
    setLang(mode);
    console.log(mode);
  };

  const handleThemeChange = (e) => {
    const theme = e.target.value;
    editorRef.current.setOption('theme', theme);
  };

  const handleRunCode = () => {
    const code = editorRef.current.getValue(); // Assuming editorRef is your reference to CodeMirror editor
    const Input = input; // Get input value from your component's state
    const language = Lang; // Assuming you want to execute python code
    console.log(Lang);
    let all = {
      code: editorRef.current.getValue(),
      Input: input,
      lang: Lang,
    }

    // Make a POST request to the server
    fetch('http://localhost:5000/runcode', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(all),
    })
      .then(response => {
        if (!response.ok) {
          setOutput("Wrong Code! Please check for errors....");
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        // Handle the response
        if (data.output) {
          // Update output state with the output received
          setOutput(data.output);
        } else {
          // Handle error, if any
          console.error('Error:', data.error);
        }
      })
      .catch(error => {
        console.error('Error:', error);
      });
  };

  return (
    <>
      <div className='menu' style={{ display: 'flex', alignItems: 'center' }}>
        <div>
          <label htmlFor="mode-select">Language:</label>
          <select id="mode-select" onChange={handleModeChange}>
            <option value="python">python</option>
            <option value="cplusplus">Cpp</option>
            <option value="java">Java</option>
          </select>
        </div>
        <div>
          <label htmlFor="theme-select">Theme:</label>
          <select id="theme-select" onChange={handleThemeChange}>
            {themeOptions.map((theme) => (
              <option key={theme} value={theme}>
                {theme}
              </option>
            ))}
          </select>
        </div>
        <div>
          <button style={{ backgroundColor: '#007bff', color: 'white', border: 'none', padding: '0.75rem 2.5rem', borderRadius: '15px', cursor: 'pointer', marginLeft: '1rem', marginTop: '25px', fontSize: '1.1rem' }} onClick={handleRunCode}>Run</button>
        </div>
      </div>
      <div className='down'>
        <div className="h-50">
          <label htmlFor="Input" className="inputLabel">Input</label>
          <textarea value={input} onChange={(e) => setInput(e.target.value)} id="input" className="form-control h-75" aria-label="Input"></textarea>
        </div>
        <div className="h-50">
          <label htmlFor="Output" className="outputLabel">Output</label>
          <textarea value={output} id="output" className="form-control h-75" aria-label="Output" readOnly></textarea>
        </div>
      </div>
      <textarea id="realtimeEditor"></textarea>
      <style>{`
        .CodeMirror-line.background {
          background-color: rgba(255, 255, 0, 0.5);
        }
      `}</style>
    </>
  );
};

export default Editor;
