document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const btnRun = document.getElementById('btn-run');
    const btnEdit = document.getElementById('btn-edit');
    const codeInput = document.getElementById('code-input');
    const editorContainer = document.getElementById('editor-container');
    const visualizerContainer = document.getElementById('visualizer-container');
    const codeLinesContainer = document.getElementById('code-lines');
    
    // Theme & File Import
    const btnThemeToggle = document.getElementById('btn-theme-toggle');
    const fileImport = document.getElementById('file-import');
    
    // Desktop Tabs
    const tabSimulation = document.getElementById('tab-simulation');
    const tabQuiz = document.getElementById('tab-quiz');
    const memoryPane = document.getElementById('memory-pane');
    const consolePane = document.getElementById('console-pane');
    const quizPane = document.getElementById('quiz-pane');
    
    // Pedagogical Bubble
    const pedagogicalBubble = document.getElementById('pedagogical-bubble');
    const bubbleText = document.getElementById('bubble-text');
    
    // Quiz elements
    const quizWelcome = document.getElementById('quiz-welcome');
    const btnStartQuiz = document.getElementById('btn-start-quiz');
    const quizQuestionContainer = document.getElementById('quiz-question-container');
    const quizProgressFill = document.getElementById('quiz-progress-fill');
    const quizQuestionNumber = document.getElementById('quiz-question-number');
    const quizQuestionCategory = document.getElementById('quiz-question-category');
    const quizQuestionText = document.getElementById('quiz-question-text');
    const quizOptionsList = document.getElementById('quiz-options-list');
    const btnQuizSubmit = document.getElementById('btn-quiz-submit');
    const btnQuizNext = document.getElementById('btn-quiz-next');
    const quizFeedback = document.getElementById('quiz-feedback');
    const quizResults = document.getElementById('quiz-results');
    const quizScoreNum = document.getElementById('quiz-score-num');
    const quizScoreGrade = document.getElementById('quiz-score-grade');
    const statAlgo = document.getElementById('stat-algo');
    const statConst = document.getElementById('stat-const');
    const statVar = document.getElementById('stat-var');
    const statTypes = document.getElementById('stat-types');
    const btnQuizRestart = document.getElementById('btn-quiz-restart');
    
    // Stepper
    const stepperControls = document.getElementById('stepper-controls');
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    const actionDesc = document.getElementById('action-desc');
    
    // Memory
    const variablesGrid = document.getElementById('variables-grid');
    const arraysContainer = document.getElementById('arrays-container');
    
    // Console
    const consoleOutput = document.getElementById('console-output');
    const inputContainer = document.getElementById('input-container');
    const consoleInput = document.getElementById('console-input');
    const btnSubmitInput = document.getElementById('btn-submit-input');
    
    // Error Modal
    const errorOverlay = document.getElementById('error-overlay');
    const errorMessage = document.getElementById('error-message');
    const btnCloseError = document.getElementById('btn-close-error');

    // State
    let snippets = [];
    let currentInputList = [];
    let snapshots = [];
    let currentIndex = 0;
    let needsInputStatus = false;
    let isDarkMode = true;

    // Light/Dark Theme Toggling
    btnThemeToggle.addEventListener('click', () => {
        isDarkMode = !isDarkMode;
        if (isDarkMode) {
            document.body.classList.remove('light-theme');
            btnThemeToggle.textContent = '🌓 Mode Sombre';
        } else {
            document.body.classList.add('light-theme');
            btnThemeToggle.textContent = '☀️ Mode Clair';
        }
    });

    // File Importing
    fileImport.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (evt) => {
            codeInput.value = evt.target.result;
        };
        reader.readAsText(file);
    });

    // Desktop Tabs Switcher
    if (tabSimulation && tabQuiz) {
        tabSimulation.addEventListener('click', () => {
            tabSimulation.classList.add('active');
            tabQuiz.classList.remove('active');
            memoryPane.classList.remove('hidden');
            consolePane.classList.remove('hidden');
            quizPane.classList.add('hidden');
        });
        
        tabQuiz.addEventListener('click', () => {
            tabQuiz.classList.add('active');
            tabSimulation.classList.remove('active');
            memoryPane.classList.add('hidden');
            consolePane.classList.add('hidden');
            quizPane.classList.remove('hidden');
        });
    }

    // Mobile Tabs
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const targetId = btn.getAttribute('data-target');
            
            // Clean active classes
            document.querySelectorAll('.app-container > section, .right-panes > section').forEach(el => {
                el.classList.remove('active');
            });
            
            const targetEl = document.getElementById(targetId);
            if(targetEl) {
                targetEl.classList.add('active');
                if(targetId !== 'code-pane') {
                    // Mobile pane handling
                    document.getElementById('code-pane').style.display = 'none';
                    document.querySelector('.right-panes').style.display = 'flex';
                    
                    // Show ONLY target section inside right panes
                    memoryPane.classList.add('hidden');
                    consolePane.classList.add('hidden');
                    quizPane.classList.add('hidden');
                    
                    targetEl.classList.remove('hidden');
                    targetEl.style.display = 'flex';
                } else {
                    document.getElementById('code-pane').style.display = 'flex';
                    document.querySelector('.right-panes').style.display = 'none';
                }
            }
        });
    });

    window.addEventListener('resize', () => {
        if(window.innerWidth > 768) {
            document.getElementById('code-pane').style.display = 'flex';
            document.querySelector('.right-panes').style.display = 'flex';
            
            // Restore desktop view layouts
            memoryPane.style.display = '';
            consolePane.style.display = '';
            quizPane.style.display = '';
            
            if (tabQuiz.classList.contains('active')) {
                memoryPane.classList.add('hidden');
                consolePane.classList.add('hidden');
                quizPane.classList.remove('hidden');
            } else {
                memoryPane.classList.remove('hidden');
                consolePane.classList.remove('hidden');
                quizPane.classList.add('hidden');
            }
        } else {
            // Restore mobile display defaults
            document.getElementById('code-pane').style.display = '';
            document.querySelector('.right-panes').style.display = '';
            
            // Trigger active mobile tab click to restore clean state
            const activeTab = document.querySelector('.tab-btn.active');
            if (activeTab) activeTab.click();
        }
    });

    // Run Code
    btnRun.addEventListener('click', async () => {
        const code = codeInput.value.trim();
        if(!code) return;

        currentInputList = []; // Reset inputs
        await executeCode(code, currentInputList);
    });

    btnEdit.addEventListener('click', () => {
        btnRun.classList.remove('hidden');
        btnEdit.classList.add('hidden');
        stepperControls.classList.add('hidden');
        editorContainer.classList.remove('hidden');
        visualizerContainer.classList.add('hidden');
        inputContainer.classList.add('hidden');
    });

    // Fetch API
    async function executeCode(code, inputs) {
        try {
            const response = await fetch('/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, inputs })
            });
            const data = await response.json();

            if (data.status === 'error') {
                showError(data.erreurs);
                return;
            }

            snapshots = data.snapshots || [];
            needsInputStatus = (data.status === 'needs_input');
            
            if(snapshots.length > 0) {
                if(inputs.length === 0) {
                   // Initial run
                   currentIndex = 0;
                   prepareVisualizationMode(code);
                } else {
                   // Resumed after input, keep currentIndex but it will increment naturally via Next button
                   // Wait, if it resumed, the last snapshot of previous run was the read. 
                   // The new run has more snapshots. 
                   // Let's just advance index by 1 so user immediately sees the effect of their input.
                   currentIndex++; 
                   if(currentIndex >= snapshots.length) currentIndex = snapshots.length - 1;
                }
                renderSnapshot(snapshots[currentIndex]);
                updateButtons();
            }

        } catch (err) {
            showError("Erreur de connexion au serveur.");
        }
    }

    function prepareVisualizationMode(code) {
        btnRun.classList.add('hidden');
        btnEdit.classList.remove('hidden');
        editorContainer.classList.add('hidden');
        visualizerContainer.classList.remove('hidden');
        stepperControls.classList.remove('hidden');
        
        // Prepare DOM lines
        const lines = code.split('\n');
        codeLinesContainer.innerHTML = '';
        lines.forEach((line, idx) => {
            const div = document.createElement('div');
            div.className = 'code-line';
            div.id = `line-${idx + 1}`;
            
            const numSpan = document.createElement('span');
            numSpan.className = 'line-num';
            numSpan.textContent = idx + 1;
            
            const codeSpan = document.createElement('span');
            codeSpan.textContent = line || ' ';
            
            div.appendChild(numSpan);
            div.appendChild(codeSpan);
            codeLinesContainer.appendChild(div);
        });
    }

    // Animation Helpers
    function getCenterCoords(element) {
        const rect = element.getBoundingClientRect();
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        return {
            x: rect.left + rect.width / 2 + scrollLeft,
            y: rect.top + rect.height / 2 + scrollTop
        };
    }

    function animateFlight(fromEl, toEl, text, color = 'var(--accent)', callback) {
        if (!fromEl || !toEl) {
            if (callback) callback();
            return;
        }
        const fromCoords = getCenterCoords(fromEl);
        const toCoords = getCenterCoords(toEl);

        const overlay = document.getElementById('animation-overlay');
        const particle = document.createElement('div');
        particle.className = 'flying-particle';
        particle.style.backgroundColor = color;
        particle.style.boxShadow = `0 0 12px ${color}`;
        particle.textContent = text;
        particle.style.left = `${fromCoords.x}px`;
        particle.style.top = `${fromCoords.y}px`;
        overlay.appendChild(particle);

        // Force layout reflow
        particle.offsetWidth;

        // Trigger transition
        particle.style.left = `${toCoords.x}px`;
        particle.style.top = `${toCoords.y}px`;

        particle.addEventListener('transitionend', () => {
            particle.remove();
            if (callback) callback();
        });
    }

    function animateJump(fromLineNum, toLineNum) {
        const fromEl = document.getElementById(`line-${fromLineNum}`);
        const toEl = document.getElementById(`line-${toLineNum}`);
        if (!fromEl || !toEl) return;

        const fromRect = fromEl.getBoundingClientRect();
        const toRect = toEl.getBoundingClientRect();
        const containerRect = document.getElementById('visualizer-container').getBoundingClientRect();
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        const x = 15; // Left margin for the curve
        const yStart = fromRect.top - containerRect.top + fromRect.height / 2;
        const yEnd = toRect.top - containerRect.top + toRect.height / 2;

        const height = Math.abs(yEnd - yStart);
        const curveSweep = Math.min(80, height / 2); // Control point offset
        
        const pathString = `M ${x} ${yStart} Q ${x - curveSweep} ${(yStart + yEnd) / 2} ${x} ${yEnd}`;

        document.querySelectorAll('.jump-curve-svg').forEach(el => el.remove());

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'jump-curve-svg');
        svg.style.left = `${containerRect.left + scrollLeft}px`;
        svg.style.top = `${containerRect.top + scrollTop}px`;
        svg.style.width = `${containerRect.width}px`;
        svg.style.height = `${containerRect.height}px`;

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathString);
        path.setAttribute('class', 'jump-path');
        
        svg.appendChild(path);
        document.body.appendChild(svg);

        setTimeout(() => {
            svg.remove();
        }, 1500);
    }

    function typewriterEffect(targetEl, fullText) {
        targetEl.innerHTML = '';
        let currentText = '';
        let i = 0;
        
        const wrapper = document.createElement('span');
        wrapper.className = 'console-line-write';
        targetEl.appendChild(wrapper);

        function type() {
            if (i < fullText.length) {
                currentText += fullText[i];
                wrapper.textContent = currentText;
                i++;
                setTimeout(type, 25);
            } else {
                wrapper.style.borderRight = 'none';
            }
        }
        type();
    }

    function renderSnapshot(snap) {
        // Highlight line
        document.querySelectorAll('.code-line.active').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.code-line.flashing-read').forEach(el => el.classList.remove('flashing-read'));
        
        let lineEl = null;
        let activeLineCode = '';
        
        if (snap.ligne_actuelle) {
            lineEl = document.getElementById(`line-${snap.ligne_actuelle}`);
            if(lineEl) {
                lineEl.classList.add('active');
                activeLineCode = lineEl.textContent.trim();
                lineEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }

        const isReading = activeLineCode.toLowerCase().includes('lire');
        if (isReading && lineEl) {
            lineEl.classList.add('flashing-read');
        }

        // Action desc
        actionDesc.textContent = snap.action || '';

        // Jumps / Selective execution
        const prevSnap = currentIndex > 0 ? snapshots[currentIndex - 1] : null;
        if (prevSnap && prevSnap.ligne_actuelle && snap.ligne_actuelle) {
            const diff = snap.ligne_actuelle - prevSnap.ligne_actuelle;
            if (Math.abs(diff) > 1) {
                animateJump(prevSnap.ligne_actuelle, snap.ligne_actuelle);
            }
        }

        // Variables & Constants
        const prevVars = prevSnap ? prevSnap.variables : {};
        const prevConsts = prevSnap ? prevSnap.constantes : {};
        renderVariables(
            snap.variables, 
            prevVars, 
            snap.types || {}, 
            snap.constantes || {}, 
            activeLineCode, 
            isReading, 
            prevConsts
        );
        
        // Arrays
        renderArrays(snap.tableaux, prevSnap ? prevSnap.tableaux : {});

        // Console typewriter
        const oldText = prevSnap ? prevSnap.sortie : '';
        const newText = snap.sortie || '';
        if (newText.startsWith(oldText) && newText.length > oldText.length) {
            const addedText = newText.substring(oldText.length);
            consoleOutput.textContent = oldText;
            typewriterEffect(consoleOutput, addedText);
        } else {
            consoleOutput.textContent = newText;
        }

        // Animation flow for Affectation & Operations
        const allPrev = { ...prevVars, ...prevConsts };
        const allCurr = { ...snap.variables, ...snap.constantes };
        
        const cpuContainer = document.getElementById('cpu-container');
        const cpuExpr = document.getElementById('cpu-expr');
        const cpuDivExtra = document.getElementById('cpu-div-extra');

        let hasOperation = false;
        let opVar1 = null;
        let opVar2 = null;
        let opSign = null;
        let targetVar = null;

        if (activeLineCode) {
            const assignMatch = activeLineCode.match(/([a-zA-Z_]\w*)\s*(?:<-|=)\s*(.*)/);
            if (assignMatch) {
                targetVar = assignMatch[1].trim().toUpperCase();
                const expr = assignMatch[2].trim();
                const opMatch = expr.match(/([a-zA-Z_]\w*)\s*([\+\-\*\/])\s*([a-zA-Z_]\w*)/);
                if (opMatch) {
                    opVar1 = opMatch[1].trim().toUpperCase();
                    opSign = opMatch[2].trim();
                    opVar2 = opMatch[3].trim().toUpperCase();
                    if (opVar1 in allPrev && opVar2 in allPrev) {
                        hasOperation = true;
                    }
                }
            }
        }

        if (hasOperation) {
            // Show CPU
            cpuContainer.classList.remove('hidden');
            cpuExpr.textContent = `${opVar1} ${opSign} ${opVar2}`;
            
            const type1 = (snap.types[opVar1] || '').toUpperCase();
            const type2 = (snap.types[opVar2] || '').toUpperCase();
            if (opSign === '/' && type1.includes('ENTIER') && type2.includes('ENTIER')) {
                cpuDivExtra.classList.remove('hidden');
            } else {
                cpuDivExtra.classList.add('hidden');
            }

            const card1 = document.getElementById(`var-card-${opVar1}`);
            const card2 = document.getElementById(`var-card-${opVar2}`);
            if (card1 && card2) {
                animateFlight(card1, cpuContainer, allPrev[opVar1], 'var(--accent)');
                animateFlight(card2, cpuContainer, allPrev[opVar2], 'var(--accent)', () => {
                    const targetCard = document.getElementById(`var-card-${targetVar}`);
                    if (targetCard) {
                        setTimeout(() => {
                            animateFlight(cpuContainer, targetCard, allCurr[targetVar], 'var(--success)');
                        }, 400);
                    }
                });
            }
        } else {
            cpuContainer.classList.add('hidden');
            
            // Simple assignments
            Object.keys(allCurr).forEach(key => {
                if (allPrev[key] !== allCurr[key] && allPrev[key] !== undefined) {
                    const targetCard = document.getElementById(`var-card-${key}`);
                    if (targetCard) {
                        let sourceEl = lineEl;
                        if (activeLineCode) {
                            const simpleAssign = activeLineCode.match(/(?:<-|=)\s*([a-zA-Z_]\w*)/);
                            if (simpleAssign) {
                                const sourceVar = simpleAssign[1].trim().toUpperCase();
                                const sourceCard = document.getElementById(`var-card-${sourceVar}`);
                                if (sourceCard) sourceEl = sourceCard;
                            }
                        }
                        animateFlight(sourceEl, targetCard, allCurr[key], 'var(--accent)');
                    }
                }
            });
        }
        
        // Input logic
        if (currentIndex === snapshots.length - 1 && needsInputStatus) {
            inputContainer.classList.remove('hidden');
            consoleInput.value = '';
            consoleInput.focus();
            consoleInput.classList.add('flashing-input');
            
            if(window.innerWidth <= 768) {
                document.querySelector('.tab-btn[data-target="console-pane"]').click();
            }
        } else {
            inputContainer.classList.add('hidden');
            consoleInput.classList.remove('flashing-input');
        }
    }

    function renderVariables(vars, prevVars, types, consts, activeLineCode, isReading, prevConsts) {
        variablesGrid.innerHTML = '';
        
        const allKeys = Array.from(new Set([...Object.keys(vars), ...Object.keys(consts)]));
        if(allKeys.length === 0) {
            variablesGrid.innerHTML = '<div class="empty-state">Aucune variable ou constante</div>';
            return;
        }

        let readVarName = null;
        if (isReading && activeLineCode) {
            const readMatch = activeLineCode.match(/Lire\s*\(\s*([a-zA-Z_]\w*)\s*\)/i);
            if (readMatch) {
                readVarName = readMatch[1].trim().toUpperCase();
            }
        }

        allKeys.forEach(key => {
            const isConst = key in consts;
            const val = isConst ? consts[key] : vars[key];
            
            const prevAll = { ...prevVars, ...prevConsts };
            const prevVal = prevAll[key];
            
            const typeName = (types[key] || 'ENTIER').toUpperCase();
            
            const div = document.createElement('div');
            div.className = `var-card ${isConst ? 'is-const' : ''}`;
            div.id = `var-card-${key}`;
            
            if(prevVal !== undefined && prevVal !== val) {
                div.classList.add('changed');
            }
            
            const lidIcon = isConst ? '🔒' : '🔓';
            
            let typeIcon = typeName;
            if (typeName.includes('ENTIER')) typeIcon = '🔢';
            else if (typeName.includes('REEL')) typeIcon = '🪙';
            else if (typeName.includes('CHAINE') || typeName.includes('STRING')) typeIcon = '📝';
            else if (typeName.includes('CARACTERE')) typeIcon = '🔤';
            else if (typeName.includes('BOOLEEN')) typeIcon = '🚦';

            div.innerHTML = `
                <div class="card-lid">${lidIcon}</div>
                <div class="type-icon" title="${typeName}">${typeIcon}</div>
                <div class="var-name">${key}</div>
                <div class="val-container"></div>
            `;
            
            const valContainer = div.querySelector('.val-container');
            
            if (val === null) {
                if (key === readVarName) {
                    valContainer.innerHTML = '<div class="flashing-question">?</div>';
                } else {
                    valContainer.innerHTML = '<span style="color: var(--text-muted); font-style: italic;">?</span>';
                }
            } else {
                if (typeName.includes('ENTIER')) {
                    let coins = '';
                    const count = Math.min(5, Math.max(1, Math.abs(parseInt(val))));
                    for(let c=0; c<count; c++) {
                        coins += '<div class="coin"></div>';
                    }
                    valContainer.innerHTML = `<div class="coins-stack">${coins}<span class="coin-value">${val}</span></div>`;
                } else if (typeName.includes('REEL')) {
                    let coins = '';
                    const count = Math.min(5, Math.max(1, Math.abs(Math.floor(parseFloat(val)))));
                    for(let c=0; c<count; c++) {
                        coins += '<div class="coin" style="background: linear-gradient(to right, #60A5FA, #3B82F6); border-color: #2563EB;"></div>';
                    }
                    valContainer.innerHTML = `<div class="coins-stack">${coins}<span class="coin-value">${parseFloat(val).toFixed(2)}</span></div>`;
                } else if (typeName.includes('CHAINE') || typeName.includes('STRING') || typeName.includes('CARACTERE')) {
                    valContainer.innerHTML = `<div class="string-ribbon" title="${val}">"${val}"</div>`;
                } else if (typeName.includes('BOOLEEN')) {
                    const colorClass = val ? 'vrai' : 'faux';
                    const label = val ? 'Vrai' : 'Faux';
                    valContainer.innerHTML = `<div class="boolean-switch ${colorClass}">${label}</div>`;
                } else {
                    valContainer.innerHTML = `<span class="var-value">${val}</span>`;
                }
            }
            
            if (prevVal !== undefined && prevVal !== val && prevVal !== null) {
                const trash = document.createElement('div');
                trash.className = 'falling-trash';
                trash.textContent = prevVal;
                valContainer.appendChild(trash);
                setTimeout(() => trash.remove(), 700);
            }
            
            variablesGrid.appendChild(div);
        });
    }

    function renderArrays(arrays, prevArrays) {
        arraysContainer.innerHTML = '';
        const keys = Object.keys(arrays);
        if(keys.length === 0) {
            arraysContainer.innerHTML = '<div class="empty-state">Aucun tableau</div>';
            return;
        }

        keys.forEach(key => {
            const arr = arrays[key];
            const prevArr = prevArrays[key] || [];
            
            const div = document.createElement('div');
            div.className = 'array-box';
            
            let cellsHTML = '';
            arr.forEach((val, i) => {
                const changed = prevArr[i] !== val ? 'changed' : '';
                cellsHTML += `
                    <div class="array-cell">
                        <div class="cell-index">${i}</div>
                        <div class="cell-value ${changed}">${val === null ? '?' : val}</div>
                    </div>
                `;
            });

            div.innerHTML = `
                <div class="array-name" style="display: flex; justify-content: space-between; align-items: center;">
                    <span>${key} 🔓</span>
                </div>
                <div class="array-cells" style="margin-top: 0.5rem;">${cellsHTML}</div>
            `;
            arraysContainer.appendChild(div);
        });
    }

    function updateButtons() {
        btnPrev.disabled = currentIndex <= 0;
        btnNext.disabled = currentIndex >= snapshots.length - 1;
    }

    btnNext.addEventListener('click', () => {
        if(currentIndex < snapshots.length - 1) {
            currentIndex++;
            renderSnapshot(snapshots[currentIndex]);
            updateButtons();
        }
    });

    btnPrev.addEventListener('click', () => {
        if(currentIndex > 0) {
            currentIndex--;
            renderSnapshot(snapshots[currentIndex]);
            updateButtons();
        }
    });

    btnSubmitInput.addEventListener('click', async () => {
        const val = consoleInput.value.trim();
        if(!val) return;
        
        currentInputList.push(val);
        inputContainer.classList.add('hidden');
        
        const lineEl = document.querySelector('.code-line.active');
        if (lineEl) {
            const activeLineCode = lineEl.textContent.trim();
            const readMatch = activeLineCode.match(/Lire\s*\(\s*([a-zA-Z_]\w*)\s*\)/i);
            if (readMatch) {
                const readVarName = readMatch[1].trim().toUpperCase();
                const targetCard = document.getElementById(`var-card-${readVarName}`);
                if (targetCard) {
                    animateFlight(consoleInput, targetCard, val, 'var(--warning)', async () => {
                        await executeCode(codeInput.value, currentInputList);
                    });
                    return;
                }
            }
        }
        
        await executeCode(codeInput.value, currentInputList);
    });

    consoleInput.addEventListener('keypress', (e) => {
        if(e.key === 'Enter') btnSubmitInput.click();
    });

    function showError(msg) {
        errorMessage.textContent = msg;
        errorOverlay.classList.remove('hidden');
    }

    btnCloseError.addEventListener('click', () => {
        errorOverlay.classList.add('hidden');
    });
});
