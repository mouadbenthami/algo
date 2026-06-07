document.addEventListener('DOMContentLoaded', () => {
    const $ = id => document.getElementById(id);
    const btnRun = $('btn-run'), btnEdit = $('btn-edit'),
          codeInput = $('code-input'), editorContainer = $('editor-container'),
          visualizerContainer = $('visualizer-container'), codeLines = $('code-lines'),
          btnTheme = $('btn-theme-toggle'),
          stepper = $('stepper-controls'), btnPrev = $('btn-prev'),
          btnNext = $('btn-next'), actionDesc = $('action-desc'),
          varGrid = $('variables-grid'),
          consoleOut = $('console-output'), inputContainer = $('input-container'),
          consoleInp = $('console-input'), btnSubmitInput = $('btn-submit-input'),
          errorOverlay = $('error-overlay'), errorMsg = $('error-message'),
          btnCloseError = $('btn-close-error'), btnReset = $('btn-reset'),
          vizArithmetic = $('viz-arithmetic'), vizLogical = $('viz-logical'),
          vizSi = $('viz-si'), vizCas = $('viz-cas'),
          vizEmpty = $('viz-empty'),
          arithmeticViz = $('arithmetic-viz'), logicalViz = $('logical-viz'),
          siViz = $('si-viz'), casVizEl = $('cas-viz');

    let snapshots = [], currentIndex = 0, currentInputs = [],
        needsInput = false, isDark = false;

    // Theme
    btnTheme.addEventListener('click', () => {
        isDark = !isDark;
        document.body.classList.toggle('light-theme', !isDark);
        btnTheme.textContent = isDark ? 'Clair' : 'Sombre';
    });

    // Mobile tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const target = btn.dataset.target;
            document.querySelectorAll('#code-pane, #memory-pane, #viz-pane, #console-pane')
                .forEach(el => el.classList.remove('active'));
            const el = $(target);
            if (el) el.classList.add('active');
            if (target === 'code-pane') {
                $('code-pane').style.display = 'flex';
                document.querySelector('.right-panes').style.display = 'none';
            } else {
                $('code-pane').style.display = 'none';
                document.querySelector('.right-panes').style.display = 'flex';
                document.querySelectorAll('#memory-pane, #viz-pane, #console-pane')
                    .forEach(e => e.classList.add('hidden'));
                el.classList.remove('hidden');
                el.style.display = 'flex';
            }
        });
    });

    function setLayout() {
        if (window.innerWidth > 768) {
            $('code-pane').style.display = 'flex';
            document.querySelector('.right-panes').style.display = 'flex';
            document.querySelectorAll('#memory-pane, #viz-pane, #console-pane')
                .forEach(e => { e.style.display = ''; e.classList.remove('hidden'); });
        } else {
            $('code-pane').style.display = '';
            document.querySelector('.right-panes').style.display = '';
            const active = document.querySelector('.tab-btn.active');
            if (active) active.click();
        }
    }
    setLayout();
    window.addEventListener('resize', setLayout);

    btnRun.addEventListener('click', async () => {
        const code = codeInput.value.trim();
        if (!code) return;
        currentInputs = [];
        await exec(code, currentInputs);
    });

    btnReset.addEventListener('click', () => {
        snapshots = []; currentIndex = 0; currentInputs = []; needsInput = false;
        btnRun.classList.remove('hidden');
        btnEdit.classList.add('hidden');
        stepper.classList.add('hidden');
        editorContainer.classList.remove('hidden');
        visualizerContainer.classList.add('hidden');
        inputContainer.classList.add('hidden');
        varGrid.innerHTML = '<div class="empty-state">Aucune variable</div>';
        consoleOut.textContent = '';
        errorOverlay.classList.add('hidden');
        hideAllViz();
        currentVizType = null; currentVizSeq = null; currentVizSteps = null; siConditionStack = [];
        vizEmpty.classList.remove('hidden');
        document.querySelectorAll('.code-line').forEach(el => el.classList.remove('active', 'flashing-read'));
    });

    btnEdit.addEventListener('click', () => {
        btnRun.classList.remove('hidden');
        btnEdit.classList.add('hidden');
        stepper.classList.add('hidden');
        editorContainer.classList.remove('hidden');
        visualizerContainer.classList.add('hidden');
        inputContainer.classList.add('hidden');
        consoleOut.textContent = '';
        varGrid.innerHTML = '<div class="empty-state">Aucune variable';
        errorOverlay.classList.add('hidden');
        hideAllViz();
        vizEmpty.classList.remove('hidden');
        arithmeticViz.innerHTML = '';
        logicalViz.innerHTML = '';
        siViz.innerHTML = '';
        casVizEl.innerHTML = '';
        currentVizType = null; currentVizSeq = null; currentVizSteps = null; siConditionStack = [];
    });

    async function exec(code, inputs) {
        try {
            const r = await fetch('/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, inputs })
            });
            const data = await r.json();
            if (data.status === 'error') { showError(data.erreurs); return; }
            snapshots = data.snapshots || [];
            needsInput = data.status === 'needs_input';
            if (snapshots.length > 0) {
                if (inputs.length === 0) { currentIndex = 0; prepViz(code); }
                else { currentIndex++; if (currentIndex >= snapshots.length) currentIndex = snapshots.length - 1; }
                render(snapshots[currentIndex]);
                updateBtns();
            }
        } catch (e) { showError('Erreur de connexion'); }
    }

    function computeIndent(lines) {
        const indents = [];
        let depth = 0;
        for (const line of lines) {
            const lower = line.toLowerCase().trim();

            // Pre-decrement: keywords that go back to parent level
            if (/\b(?:finsi|fintantque|finpour|fincas|fin)\b/.test(lower)) depth = Math.max(0, depth - 1);
            if (/\bsinon\b/.test(lower)) depth = Math.max(0, depth - 1);
            if (/\bdebut\b/.test(lower)) depth = Math.max(0, depth - 1);

            indents.push(depth);

            // Post-increment: keywords that open a block for the next lines
            if (/\b(?:debut|alors|faire|sinon)\b/.test(lower)) depth++;
            if (/\b(?:variables|constante)\b/.test(lower)) depth++;
            if (/\bcas\b/.test(lower)) depth++;
        }
        return indents;
    }

    function prepViz(code) {
        btnRun.classList.add('hidden');
        btnEdit.classList.remove('hidden');
        editorContainer.classList.add('hidden');
        visualizerContainer.classList.remove('hidden');
        stepper.classList.remove('hidden');
        codeLines.innerHTML = '';
        const lines = code.split('\n');
        const indents = computeIndent(lines);
        lines.forEach((line, idx) => {
            const div = document.createElement('div');
            div.className = 'code-line';
            div.id = `line-${idx+1}`;
            const num = document.createElement('span');
            num.className = 'line-num';
            num.textContent = idx + 1;
            const codeSpan = document.createElement('span');
            codeSpan.innerHTML = highlightLine(line) || '&nbsp;';
            codeSpan.style.display = 'inline-block';
            codeSpan.style.paddingLeft = (indents[idx] * 1.5) + 'rem';
            div.appendChild(num);
            div.appendChild(codeSpan);
            codeLines.appendChild(div);
        });
    }

    // Syntax highlighting
    const KW = new Set(['debut','fin','si','alors','sinon','finsi','cas','vaut','autre','fincas','lire','ecrire','constante','variables','algorithme','tableau','tantque','faire','fintantque','pour','allant','finpour']);
    const TYPES = new Set(['entier','reel','chaine','booleen','caractere','réel','booléen']);
    const OP_MULTI = ['<-','<=','>=','<>','!=','ET','OU','NON'];

    function highlightLine(line) {
        if (!line.trim()) return '';
        let html = '', i = 0;
        while (i < line.length) {
            if (line[i] === '"' || line[i] === "'") {
                const q = line[i]; let j = i+1;
                while (j < line.length && line[j] !== q) j++;
                html += '<span class="syn-string">'+esc(line.slice(i,j+1))+'</span>';
                i = j+1; continue;
            }
            if (line[i] === '/' && i+1 < line.length && line[i+1] === '/') {
                html += '<span class="syn-comment">'+esc(line.slice(i))+'</span>'; break;
            }
            if (/\d/.test(line[i])) {
                let j = i, r = false;
                while (j < line.length && (/\d/.test(line[j]) || (line[j]==='.' && !r))) { if (line[j]==='.') r=true; j++; }
                html += '<span class="syn-number">'+esc(line.slice(i,j))+'</span>';
                i = j; continue;
            }
            let matched = false;
            for (const op of OP_MULTI) {
                if (line.slice(i,i+op.length).toUpperCase() === op) {
                    html += '<span class="syn-operator">'+esc(line.slice(i,i+op.length))+'</span>';
                    i += op.length; matched = true; break;
                }
            }
            if (matched) continue;
            if ('+-*/=<>()[],;:'.includes(line[i])) {
                html += '<span class="syn-operator">'+esc(line[i])+'</span>'; i++; continue;
            }
            if (/[a-zA-Z_]/.test(line[i])) {
                let j = i;
                while (j < line.length && /[a-zA-Z0-9_]/.test(line[j])) j++;
                const w = line.slice(i,j), l = w.toLowerCase();
                if (KW.has(l)) html += '<span class="syn-keyword">'+esc(w)+'</span>';
                else if (TYPES.has(l)) html += '<span class="syn-type">'+esc(w)+'</span>';
                else html += '<span class="syn-variable">'+esc(w)+'</span>';
                i = j; continue;
            }
            html += esc(line[i]); i++;
        }
        return html;
    }
    function esc(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

    // Viz state
    let currentVizType = null, currentVizSeq = null, currentVizSteps = null;
    let siConditionStack = [];
    let vizMemorySnapshot = null; // memory state from the last non-viz-step snapshot

    function render(snap) {
        document.querySelectorAll('.code-line.active, .code-line.flashing-read')
            .forEach(el => el.classList.remove('active', 'flashing-read'));

        const isVizStep = snap.viz_type && snap.viz_final !== true && currentVizType === snap.viz_type && currentVizSeq === snap.viz_seq;

        // Code line
        if (snap.ligne_actuelle && !isVizStep) {
            const el = $(`line-${snap.ligne_actuelle}`);
            if (el) { el.classList.add('active'); el.scrollIntoView({behavior:'smooth',block:'center'}); }
        }

        actionDesc.textContent = snap.action || '';

        // Input flash
        if (snap.ligne_actuelle) {
            const el = $(`line-${snap.ligne_actuelle}`);
            if (el && (snap.action||'').toLowerCase().includes('lecture')) el.classList.add('flashing-read');
        }

        // Memory (skip intermediate viz steps)
        const prev = currentIndex > 0 ? snapshots[currentIndex-1] : null;
        if (!isVizStep) {
            renderVars(snap.variables, prev ? prev.variables : {}, snap.types || {}, snap.constantes || {}, prev ? prev.constantes : {});
        }

        // Console (skip intermediate viz steps)
        const oldText = prev ? prev.sortie : '';
        const newText = snap.sortie || '';
        if (!isVizStep && newText) {
            if (newText.startsWith(oldText) && newText.length > oldText.length) {
                const added = newText.substring(oldText.length);
                consoleOut.textContent = oldText;
                typewriter(consoleOut, added);
            } else { consoleOut.textContent = newText; }
        }

        // Input
        if (currentIndex === snapshots.length - 1 && needsInput) {
            inputContainer.classList.remove('hidden'); consoleInp.value = ''; consoleInp.focus();
        } else { inputContainer.classList.add('hidden'); }

        // Visualization
        renderViz(snap);
    }

    function hideAllViz() {
        [vizArithmetic, vizLogical, vizSi, vizCas].forEach(el => el.classList.add('hidden'));
        vizEmpty.classList.remove('hidden');
    }

    function renderViz(snap) {
        const inSi = snap.block_active && snap.block_active.includes('si');
        const inCas = snap.block_active && snap.block_active.includes('cas');

        hideAllViz();
        let hasAny = false;

        // Arithmetic sequence
        if (snap.viz_type === 'arithmetic' && snap.viz_steps) {
            vizArithmetic.classList.remove('hidden'); vizEmpty.classList.add('hidden');
            hasAny = true; currentVizType = 'arithmetic'; currentVizSeq = snap.viz_seq;
            currentVizSteps = snap.viz_steps;
            renderArithmetic(snap.viz_steps, snap.viz_step, snap.viz_total, snap.viz_final, snap.arithmetic_final);
        }

        // Logical sequence
        if (snap.viz_type === 'logical' && snap.viz_steps) {
            vizLogical.classList.remove('hidden'); vizEmpty.classList.add('hidden');
            hasAny = true; currentVizType = 'logical'; currentVizSeq = snap.viz_seq;
            currentVizSteps = snap.viz_steps;
            renderLogical(snap.viz_steps, snap.viz_step, snap.viz_total, snap.viz_final);
        }

        // Si condition — persist while inside Si block via block_active
        if (snap.condition || inSi) {
            vizSi.classList.remove('hidden'); vizEmpty.classList.add('hidden');
            hasAny = true;
            if (snap.condition) {
                const depth = snap.block_active ? snap.block_active.lastIndexOf('si') : 0;
                siConditionStack[depth] = { condition: snap.condition, branch: snap.branch, logicalSteps: snap.logical_steps };
            }
            // Render all diamonds in stack
            siViz.innerHTML = '';
            siConditionStack.forEach((sc, i) => {
                if (!sc) return;
                const isOuter = i < siConditionStack.length - 1;
                renderSi(sc.condition, sc.branch, sc.logicalSteps, isOuter);
            });
        }
        // When leaving all Si blocks
        if (!inSi && siConditionStack.length > 0) {
            siConditionStack = [];
        }

        // Cas — persist while inside Cas block via block_active
        if (snap.cas_value !== undefined || inCas) {
            vizCas.classList.remove('hidden'); vizEmpty.classList.add('hidden');
            hasAny = true;
            if (snap.cas_value !== undefined) {
                currentVizType = 'cas';
                renderCas(snap.cas_value, snap.cas_cases || [], snap.cas_else, snap.cas_else_selected, snap.cas_step, snap.cas_current, snap.cas_checked);
            }
        }

        if (!hasAny) { vizEmpty.classList.remove('hidden'); currentVizType = null; currentVizSeq = null; currentVizSteps = null; }
    }

    // === ARITHMETIC RENDERER ===
    function renderArithmetic(steps, curStep, total, isFinal, finalText) {
        arithmeticViz.innerHTML = '';
        const container = document.createElement('div');
        container.className = 'arithmetic-tree';

        steps.forEach((s, i) => {
            const node = document.createElement('div');
            node.className = 'arithmetic-node';
            if (i < curStep) node.classList.add('completed-step');
            else if (i === curStep) node.classList.add('active-step');
            else node.classList.add('pending-step');
            node.innerHTML = `<span class="step-badge">${i+1}</span><span class="node-op">${esc(s.operation)}</span>`;
            if (i <= curStep) {
                node.innerHTML += `<span class="node-result">= ${esc(String(s.result))}</span>`;
            }
            container.appendChild(node);
            if (i < steps.length - 1) {
                const conn = document.createElement('div');
                conn.className = 'arithmetic-connector';
                container.appendChild(conn);
            }
        });

        // Final assignment
        if (isFinal && finalText) {
            const conn = document.createElement('div');
            conn.className = 'arithmetic-connector';
            container.appendChild(conn);
            const fin = document.createElement('div');
            fin.className = 'arithmetic-final-node';
            fin.textContent = finalText;
            container.appendChild(fin);
        }

        arithmeticViz.appendChild(container);
    }

    // === LOGICAL RENDERER ===
    function renderLogical(steps, curStep, total, isFinal) {
        logicalViz.innerHTML = '';
        const container = document.createElement('div');
        container.className = 'logical-flow';

        steps.forEach((s, i) => {
            const box = document.createElement('div');
            box.className = 'logical-step-box';
            if (i < curStep) box.classList.add('completed-step');
            else if (i === curStep) box.classList.add('active-step');
            else box.classList.add('pending-step');
            const isBool = s.result === 'Vrai' || s.result === 'Faux';
            box.innerHTML = `
                <span class="step-label">${esc(s.expression)}</span>
                <span class="step-arrow">→</span>
                <span class="step-result ${isBool ? (s.result === 'Vrai' ? 'vrai' : 'faux') : ''}">${esc(s.result)}</span>
            `;
            container.appendChild(box);
            if (i < steps.length - 1) {
                const conn = document.createElement('div');
                conn.className = 'logical-connector';
                container.appendChild(conn);
            }
        });

        logicalViz.appendChild(container);
    }

    // === SI SVG RENDERER ===
    function renderSi(condition, branch, logicalSteps, isOuter) {
        const expr = esc(condition.expression);
        const isPending = branch === undefined || branch === null;
        const isOui = branch === 'Oui';
        const isTrue = condition.result === true || condition.result === 'Vrai';


        // Show logical steps if present (above the diamond)
        if (logicalSteps && logicalSteps.length > 0) {
            const stepsDiv = document.createElement('div');
            stepsDiv.style.cssText = 'width:100%;margin-bottom:0.5rem;';
            stepsDiv.innerHTML = logicalSteps.map(s =>
                `<div style="display:flex;align-items:center;gap:0.4rem;padding:0.25rem 0.4rem;font-family:var(--font-code);font-size:0.75rem;background:var(--bg-primary);border-radius:4px;margin-bottom:0.2rem;">
                    <span style="flex:1;color:var(--text-main)">${esc(s.expression)}</span>
                    <span>→</span>
                    <span style="font-weight:600;color:${s.result==='Vrai'?'var(--success)':'var(--error)'}">${esc(s.result)}</span>
                </div>`
            ).join('');
            siViz.appendChild(stepsDiv);
        }

        // Create SVG decision diamond
        const svgNS = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(svgNS, 'svg');
        svg.setAttribute('viewBox', '0 0 260 200');
        svg.setAttribute('width', '100%');
        svg.style.maxWidth = '280px';
        svg.style.height = 'auto';
        svg.classList.add('si-flowchart');
        if (isOuter) svg.style.opacity = '0.5';

        // Definitions for arrow markers
        const defs = document.createElementNS(svgNS, 'defs');
        defs.innerHTML = `
            <marker id="arrowhead" viewBox="0 0 10 7" refX="10" refY="3.5" markerWidth="8" markerHeight="6" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="var(--text-muted)"/>
            </marker>
            <marker id="arrowhead-active" viewBox="0 0 10 7" refX="10" refY="3.5" markerWidth="8" markerHeight="6" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="var(--accent)"/>
            </marker>
            <filter id="diamond-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="var(--accent)" flood-opacity="0.4"/>
            </filter>
        `;
        svg.appendChild(defs);

        // Diamond center at (130, 50), width=140, height=60
        const dx = 130, dy = 50, dw = 70, dh = 30;
        const edgeY = dy + dh - dh * (30 / dw); // start arrows exactly on diamond lower edges
        const diamond = document.createElementNS(svgNS, 'polygon');
        const pts = `${dx},${dy-dh} ${dx+dw},${dy} ${dx},${dy+dh} ${dx-dw},${dy}`;
        diamond.setAttribute('points', pts);

        if (isPending) {
            diamond.setAttribute('fill', 'var(--diamond-fill-pending)');
            diamond.setAttribute('stroke', 'var(--text-muted)');
        } else if (isTrue) {
            diamond.setAttribute('fill', 'var(--diamond-fill-true)');
            diamond.setAttribute('stroke', 'var(--success)');
        } else {
            diamond.setAttribute('fill', 'var(--diamond-fill-false)');
            diamond.setAttribute('stroke', 'var(--error)');
        }
        diamond.setAttribute('stroke-width', '2');
        if (!isPending) diamond.setAttribute('filter', 'url(#diamond-glow)');
        svg.appendChild(diamond);

        // Diamond text
        const text = document.createElementNS(svgNS, 'text');
        text.setAttribute('x', dx); text.setAttribute('y', dy+1);
        text.setAttribute('class', 'diamond-text');
        text.setAttribute('font-size', '11');
        const words = expr.length > 18 ? expr.substring(0,16)+'..' : expr;
        text.textContent = words + ' ?';
        svg.appendChild(text);

        // Oui branch (left-down)
        const ouiLine = document.createElementNS(svgNS, 'path');
        const ouiPath = `M ${dx-30} ${edgeY} Q ${dx-60} ${dy+50} ${dx-60} ${dy+80} L ${dx-60} ${dy+90}`;
        ouiLine.setAttribute('d', ouiPath);
        if (isPending) {
            ouiLine.setAttribute('class', 'exec-arrow inactive');
            ouiLine.setAttribute('marker-end', 'url(#arrowhead)');
        } else {
            ouiLine.setAttribute('class', `exec-arrow ${isOui ? 'active' : 'inactive'}`);
            ouiLine.setAttribute('marker-end', isOui ? 'url(#arrowhead-active)' : 'url(#arrowhead)');
        }
        svg.appendChild(ouiLine);

        // Non branch (right-down)
        const nonLine = document.createElementNS(svgNS, 'path');
        const nonPath = `M ${dx+30} ${edgeY} Q ${dx+60} ${dy+50} ${dx+60} ${dy+80} L ${dx+60} ${dy+90}`;
        nonLine.setAttribute('d', nonPath);
        if (isPending) {
            nonLine.setAttribute('class', 'exec-arrow inactive');
            nonLine.setAttribute('marker-end', 'url(#arrowhead)');
        } else {
            nonLine.setAttribute('class', `exec-arrow ${!isOui ? 'active' : 'inactive'}`);
            nonLine.setAttribute('marker-end', !isOui ? 'url(#arrowhead-active)' : 'url(#arrowhead)');
        }
        svg.appendChild(nonLine);

        // Oui label
        const ouiLabel = document.createElementNS(svgNS, 'text');
        ouiLabel.setAttribute('x', dx-65); ouiLabel.setAttribute('y', dy+35);
        ouiLabel.setAttribute('class', `branch-label oui ${isPending || !isOui ? 'inactive' : ''}`);
        ouiLabel.textContent = 'Oui';
        svg.appendChild(ouiLabel);

        // Non label
        const nonLabel = document.createElementNS(svgNS, 'text');
        nonLabel.setAttribute('x', dx+65); nonLabel.setAttribute('y', dy+35);
        nonLabel.setAttribute('class', `branch-label non ${isPending || isOui ? 'inactive' : ''}`);
        nonLabel.textContent = 'Non';
        svg.appendChild(nonLabel);

        // Show action under active branch (only when resolved)
        if (!isPending) {
            if (isOui) {
                const rect = document.createElementNS(svgNS, 'rect');
                rect.setAttribute('x', dx-80); rect.setAttribute('y', dy+95);
                rect.setAttribute('width', '80'); rect.setAttribute('height', '24');
                rect.setAttribute('rx', '4'); rect.setAttribute('fill', 'var(--action-box-fill-oui)');
                rect.setAttribute('stroke', 'var(--success)'); rect.setAttribute('stroke-width', '1.5');
                svg.appendChild(rect);
                const actText = document.createElementNS(svgNS, 'text');
                actText.setAttribute('x', dx-40); actText.setAttribute('y', dy+107);
                actText.setAttribute('class', 'action-box');
                actText.setAttribute('fill', 'var(--success)');
                actText.textContent = '✓ Oui';
                svg.appendChild(actText);
            } else {
                const rect = document.createElementNS(svgNS, 'rect');
                rect.setAttribute('x', dx); rect.setAttribute('y', dy+95);
                rect.setAttribute('width', '80'); rect.setAttribute('height', '24');
                rect.setAttribute('rx', '4'); rect.setAttribute('fill', 'var(--action-box-fill-non)');
                rect.setAttribute('stroke', 'var(--error)'); rect.setAttribute('stroke-width', '1.5');
                svg.appendChild(rect);
                const actText = document.createElementNS(svgNS, 'text');
                actText.setAttribute('x', dx+40); actText.setAttribute('y', dy+107);
                actText.setAttribute('class', 'action-box');
                actText.setAttribute('fill', 'var(--error)');
                actText.textContent = '✗ Non';
                svg.appendChild(actText);
            }
        }

        siViz.appendChild(svg);
    }

    // === CAS SVG RENDERER ===
    function renderCas(value, cases, hasElse, elseSelected, casStep, casCurrent, casChecked) {
        casVizEl.innerHTML = '';
        const svgNS = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(svgNS, 'svg');
        const n = cases.length + (hasElse ? 1 : 0);
        const w = Math.max(220, n * 55);
        svg.setAttribute('viewBox', `0 0 ${w} 180`);
        svg.setAttribute('width', '100%');
        svg.style.maxWidth = '350px';
        svg.style.height = 'auto';
        svg.classList.add('cas-flowchart');

        const defs = document.createElementNS(svgNS, 'defs');
        defs.innerHTML = `
            <marker id="cas-arrow" viewBox="0 0 10 7" refX="10" refY="3.5" markerWidth="8" markerHeight="6" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="var(--text-muted)"/>
            </marker>
            <marker id="cas-arrow-active" viewBox="0 0 10 7" refX="10" refY="3.5" markerWidth="8" markerHeight="6" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="var(--accent)"/>
            </marker>
        `;
        svg.appendChild(defs);

        const isEvaluating = casStep === 'evaluating';
        const isChecking = casStep === 'checking';
        const isMatched = casStep === 'matched';

        // Top: Show value box
        const valRect = document.createElementNS(svgNS, 'rect');
        valRect.setAttribute('x', w/2-35); valRect.setAttribute('y', 5);
        valRect.setAttribute('width', '70'); valRect.setAttribute('height', '26');
        valRect.setAttribute('rx', '6');
        if (isEvaluating) {
            valRect.setAttribute('fill', 'rgba(251,191,36,0.15)');
            valRect.setAttribute('stroke', 'var(--warning)');
        } else {
            valRect.setAttribute('fill', 'var(--cas-value-box-fill)');
            valRect.setAttribute('stroke', 'var(--accent)');
        }
        valRect.setAttribute('stroke-width', '1.5');
        svg.appendChild(valRect);
        const valText = document.createElementNS(svgNS, 'text');
        valText.setAttribute('x', w/2); valText.setAttribute('y', 18);
        valText.setAttribute('class', 'cas-value-box');
        valText.textContent = isEvaluating ? `x = ${value}` : `x = ${value}`;
        svg.appendChild(valText);

        // Arrow down from value to branches
        const arrow1 = document.createElementNS(svgNS, 'line');
        arrow1.setAttribute('x1', w/2); arrow1.setAttribute('y1', 31);
        arrow1.setAttribute('x2', w/2); arrow1.setAttribute('y2', 50);
        arrow1.setAttribute('class', 'cas-arrow');
        arrow1.setAttribute('marker-end', 'url(#cas-arrow)');
        svg.appendChild(arrow1);

        // Horizontal line for branches
        const hLine = document.createElementNS(svgNS, 'line');
        hLine.setAttribute('x1', 20); hLine.setAttribute('y1', 55);
        hLine.setAttribute('x2', w-20); hLine.setAttribute('y2', 55);
        hLine.setAttribute('stroke', 'var(--bg-tertiary)');
        hLine.setAttribute('stroke-width', '1.5');
        svg.appendChild(hLine);

        // Vertical line from value to horizontal
        const vLine = document.createElementNS(svgNS, 'line');
        vLine.setAttribute('x1', w/2); vLine.setAttribute('y1', 50);
        vLine.setAttribute('x2', w/2); vLine.setAttribute('y2', 55);
        vLine.setAttribute('stroke', 'var(--bg-tertiary)');
        vLine.setAttribute('stroke-width', '1.5');
        svg.appendChild(vLine);

        // Branch boxes
        const spacing = (w - 40) / n;
        let matchedIdx = -1;
        cases.forEach((c, i) => { if (c.matched) matchedIdx = i; });
        if (matchedIdx === -1 && hasElse && elseSelected) matchedIdx = cases.length;

        function branchState(i) {
            if (isMatched) return cases[i] && cases[i].matched ? 'matched' : '';
            if (isEvaluating) return 'pending';
            if (isChecking) {
                if (casChecked && casChecked.includes(i)) return 'checked';
                if (casCurrent === i) return 'current';
                return 'pending';
            }
            return '';
        }

        cases.forEach((c, i) => {
            const cx = 20 + spacing * i + spacing / 2;
            const state = branchState(i);
            const isMatch = c.matched;

            const vLineB = document.createElementNS(svgNS, 'line');
            vLineB.setAttribute('x1', cx); vLineB.setAttribute('y1', 55);
            vLineB.setAttribute('x2', cx); vLineB.setAttribute('y2', 72);
            vLineB.setAttribute('class', `cas-arrow ${isMatch ? 'active' : ''}`);
            if (isMatch) vLineB.setAttribute('marker-end', 'url(#cas-arrow-active)');
            else if (state === 'current') {
                vLineB.setAttribute('marker-end', 'url(#cas-arrow-active)');
                vLineB.setAttribute('stroke', 'var(--warning)');
            }
            else vLineB.setAttribute('marker-end', 'url(#cas-arrow)');
            if (state === 'checked') vLineB.setAttribute('opacity', '0.3');
            svg.appendChild(vLineB);

            const rect = document.createElementNS(svgNS, 'rect');
            rect.setAttribute('x', cx-20); rect.setAttribute('y', 72);
            rect.setAttribute('width', '40'); rect.setAttribute('height', '30');
            if (state === 'current') {
                rect.setAttribute('fill', 'rgba(251,191,36,0.2)');
                rect.setAttribute('stroke', 'var(--warning)');
            } else if (isMatch) {
                rect.setAttribute('class', 'cas-branch-rect matched');
            } else {
                rect.setAttribute('class', 'cas-branch-rect unmatched');
            }
            if (state === 'checked' || state === 'pending' || (!isMatch && !isMatch && state !== 'current')) {
                rect.setAttribute('opacity', '0.4');
            }
            svg.appendChild(rect);

            const txt = document.createElementNS(svgNS, 'text');
            txt.setAttribute('x', cx); txt.setAttribute('y', 87);
            txt.setAttribute('class', `cas-branch-box ${isMatch ? 'matched' : 'unmatched'}`);
            if (state === 'checked' || state === 'pending' || (!isMatch && !isMatch && state !== 'current')) {
                txt.setAttribute('opacity', '0.4');
            }
            txt.textContent = String(c.value);
            svg.appendChild(txt);
        });

        // Else branch
        if (hasElse) {
            const cx = 20 + spacing * cases.length + spacing / 2;
            const isMatch = elseSelected === true;
            const state = isMatched ? (isMatch ? 'matched' : '') : (isEvaluating ? 'pending' : 'pending');

            const vLineB = document.createElementNS(svgNS, 'line');
            vLineB.setAttribute('x1', cx); vLineB.setAttribute('y1', 55);
            vLineB.setAttribute('x2', cx); vLineB.setAttribute('y2', 72);
            vLineB.setAttribute('class', `cas-arrow ${isMatch ? 'active' : ''}`);
            if (isMatch) vLineB.setAttribute('marker-end', 'url(#cas-arrow-active)');
            else vLineB.setAttribute('marker-end', 'url(#cas-arrow)');
            if (state === 'pending') vLineB.setAttribute('opacity', '0.4');
            svg.appendChild(vLineB);

            const rect = document.createElementNS(svgNS, 'rect');
            rect.setAttribute('x', cx-20); rect.setAttribute('y', 72);
            rect.setAttribute('width', '40'); rect.setAttribute('height', '30');
            rect.setAttribute('class', `cas-branch-rect ${isMatch ? 'matched' : 'unmatched'}`);
            rect.setAttribute('stroke-dasharray', '4,3');
            if (!isMatch) rect.setAttribute('opacity', '0.4');
            svg.appendChild(rect);

            const txt = document.createElementNS(svgNS, 'text');
            txt.setAttribute('x', cx); txt.setAttribute('y', 87);
            txt.setAttribute('class', `cas-branch-box ${isMatch ? 'matched' : 'unmatched'}`);
            if (!isMatch) txt.setAttribute('opacity', '0.4');
            txt.textContent = 'Autre';
            svg.appendChild(txt);
        }

        // Show execution arrow below matched branch
        if (matchedIdx >= 0) {
            const cx = 20 + spacing * matchedIdx + spacing / 2;
            const downArrow = document.createElementNS(svgNS, 'line');
            downArrow.setAttribute('x1', cx); downArrow.setAttribute('y1', 102);
            downArrow.setAttribute('x2', cx); downArrow.setAttribute('y2', 134);
            downArrow.setAttribute('class', 'cas-arrow active');
            downArrow.setAttribute('marker-end', 'url(#cas-arrow-active)');
            svg.appendChild(downArrow);

            const execRect = document.createElementNS(svgNS, 'rect');
            execRect.setAttribute('x', cx-30); execRect.setAttribute('y', 135);
            execRect.setAttribute('width', '60'); execRect.setAttribute('height', '24');
            execRect.setAttribute('rx', '4');
            execRect.setAttribute('fill', 'var(--cas-exec-fill)');
            execRect.setAttribute('stroke', 'var(--success)');
            execRect.setAttribute('stroke-width', '1.5');
            svg.appendChild(execRect);

            const execTxt = document.createElementNS(svgNS, 'text');
            execTxt.setAttribute('x', cx); execTxt.setAttribute('y', 150);
            execTxt.setAttribute('class', 'action-box');
            execTxt.setAttribute('fill', 'var(--success)');
            execTxt.textContent = '✓ Exécuté';
            svg.appendChild(execTxt);
        }

        casVizEl.appendChild(svg);
    }

    // === MEMORY ===
    function renderVars(vars, prevVars, types, consts, prevConsts) {
        varGrid.innerHTML = '';
        const keys = Array.from(new Set([...Object.keys(vars), ...Object.keys(consts)]));
        if (keys.length === 0) { varGrid.innerHTML = '<div class="empty-state">Aucune variable</div>'; return; }
        keys.forEach(key => {
            const isConst = key in consts;
            const val = isConst ? consts[key] : vars[key];
            const prevAll = {...prevVars, ...prevConsts};
            const prevVal = prevAll[key];
            const typeName = (types[key]||'ENTIER').toUpperCase();

            const card = document.createElement('div');
            card.className = `var-card ${isConst?'is-const':''}`;
            card.id = `var-card-${key}`;
            if (prevVal !== undefined && prevVal !== val) card.classList.add('changed');

            let typeLabel, typeClass;
            if (typeName.includes('ENTIER')) { typeLabel='123'; typeClass='entier'; }
            else if (typeName.includes('REEL')) { typeLabel='12.34'; typeClass='reel'; }
            else if (typeName.includes('CHAINE')||typeName.includes('CARACTERE')) { typeLabel='Aa'; typeClass='chaine'; }
            else if (typeName.includes('BOOLEEN')) { typeLabel='ON/OFF'; typeClass='booleen'; }
            else { typeLabel='?'; typeClass=''; }

            const icon = isConst ? '<span class="var-const-icon">🔒</span>' : '';
            let vhtml;
            if (val === null) vhtml = '<span class="var-value null-value">?</span>';
            else if (typeName.includes('BOOLEEN')) vhtml = `<span class="var-value ${val?'boolean-true':'boolean-false'}">${val?'Vrai':'Faux'}</span>`;
            else if (typeName.includes('CHAINE')||typeName.includes('CARACTERE')) vhtml = `<span class="var-value">"${esc(String(val))}"</span>`;
            else vhtml = `<span class="var-value">${esc(String(val))}</span>`;

            card.innerHTML = `<div class="var-card-header"><span class="type-badge ${typeClass}">${typeLabel}</span><span class="var-name">${esc(key)}</span>${icon}</div>${vhtml}`;
            varGrid.appendChild(card);
        });
    }

    function updateBtns() { btnPrev.disabled = currentIndex <= 0; btnNext.disabled = currentIndex >= snapshots.length - 1; }

    btnNext.addEventListener('click', () => { if (currentIndex < snapshots.length - 1) { currentIndex++; render(snapshots[currentIndex]); updateBtns(); } });
    btnPrev.addEventListener('click', () => { if (currentIndex > 0) { currentIndex--; render(snapshots[currentIndex]); updateBtns(); } });
    btnSubmitInput.addEventListener('click', async () => { const val = consoleInp.value.trim(); if (!val) return; currentInputs.push(val); inputContainer.classList.add('hidden'); await exec(codeInput.value, currentInputs); });
    consoleInp.addEventListener('keypress', e => { if (e.key === 'Enter') btnSubmitInput.click(); });

    function showError(msg) { errorMsg.textContent = msg; errorOverlay.classList.remove('hidden'); }
    btnCloseError.addEventListener('click', () => errorOverlay.classList.add('hidden'));

    function typewriter(el, text) {
        el.innerHTML = '';
        const w = document.createElement('span');
        w.className = 'console-line-write';
        el.appendChild(w);
        let i = 0;
        (function type() { if (i < text.length) { w.textContent += text[i]; i++; setTimeout(type,15); } })();
    }
});
