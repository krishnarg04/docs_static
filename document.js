document.addEventListener('DOMContentLoaded', function() {
    const editor = document.getElementById('editor');

    let isCheckingOverflow = false;

    initializeEditor();

    editor.focus();

    let autoSaveInterval = setInterval(() => {
        localStorage.setItem('document-autosave', editor.innerHTML);
    }, 30000); 
    let undoStack = [];
    let redoStack = [];
    
    function saveCurrentState() {
        undoStack.push(editor.innerHTML);
        if (undoStack.length > 50) undoStack.shift(); 
        redoStack = [];
    }
    

    saveCurrentState();
    

    editor.addEventListener('input', function(e) {
        saveCurrentState();

        clearTimeout(this.overflowTimer);
        

        const isEnterKey = e.inputType === 'insertParagraph';
        
        if (isEnterKey) {

            this.overflowTimer = setTimeout(() => {

                const selection = window.getSelection();
                if (selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    const container = range.commonAncestorContainer;
                    const currentPage = container.nodeType === 3 ? 
                        container.parentNode.closest('.page') : 
                        container.closest('.page');
                    
                    if (currentPage) {
                        const maxHeightPx = 257 * 3.779; 
                        

                        let contentHeight = 0;
                        Array.from(currentPage.children).forEach(child => {
                            contentHeight += child.offsetHeight;
                        });

                        
                        if (contentHeight > maxHeightPx * 0.8) {
                            checkPageOverflow();
                            ensureCursorInCorrectPage();
                        }
                    }
                }
            }, 2000);
        } else {

            this.overflowTimer = setTimeout(() => {
                checkPageOverflow();
            }, 1000);
        }
    });


    editor.addEventListener('keydown', function(e) {

        if (e.key === 'Enter') {

            
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const container = range.commonAncestorContainer;
                const currentPage = container.nodeType === 3 ? 
                    container.parentNode.closest('.page') : 
                    container.closest('.page');
                
                if (currentPage) {
         
                    const pages = document.querySelectorAll('.page');
                    pages.forEach(p => p.removeAttribute('data-lastEditedPage'));

                    currentPage.dataset.lastEditedPage = "true";

                    setTimeout(() => {
                        ensureCursorInCorrectPage();

                        setTimeout(() => {
                            if (currentPage) {
                                const maxHeightPx = 257 * 3.779;
                                let contentHeight = 0;
                                Array.from(currentPage.children).forEach(child => {
                                    contentHeight += child.offsetHeight;
                                });
                                
                                if (contentHeight > maxHeightPx * 0.8) {
                                    checkPageOverflow();
                                }
                            }
                        }, 1000);
                    }, 10);
                }
            }
        }
    });
    

    
    document.getElementById('bold-btn').addEventListener('click', () => {
        document.execCommand('bold', false, null);
        editor.focus();
    });
    
    document.getElementById('italic-btn').addEventListener('click', () => {
        document.execCommand('italic', false, null);
        editor.focus();
    });
    
    document.getElementById('underline-btn').addEventListener('click', () => {
        document.execCommand('underline', false, null);
        editor.focus();
    });
    
    document.getElementById('strikethrough-btn').addEventListener('click', () => {
        document.execCommand('strikeThrough', false, null);
        editor.focus();
    });
    
  
    
    document.getElementById('font-family').addEventListener('change', (e) => {
        document.execCommand('fontName', false, e.target.value);
        editor.focus();
    });
    
    document.getElementById('font-size').addEventListener('change', (e) => {
        document.execCommand('fontSize', false, e.target.value);
        editor.focus();
    });
    

    
    document.getElementById('text-color').addEventListener('input', (e) => {
        document.execCommand('foreColor', false, e.target.value);
        editor.focus();
    });
    
    document.getElementById('highlight-color').addEventListener('input', (e) => {
        document.execCommand('hiliteColor', false, e.target.value);
        editor.focus();
    });
    

    
    document.getElementById('align-left-btn').addEventListener('click', () => {
        document.execCommand('justifyLeft', false, null);
        editor.focus();
    });
    
    document.getElementById('align-center-btn').addEventListener('click', () => {
        document.execCommand('justifyCenter', false, null);
        editor.focus();
    });
    
    document.getElementById('align-right-btn').addEventListener('click', () => {
        document.execCommand('justifyRight', false, null);
        editor.focus();
    });
    
    document.getElementById('align-justify-btn').addEventListener('click', () => {
        document.execCommand('justifyFull', false, null);
        editor.focus();
    });
    
 
    
    document.getElementById('bullet-list-btn').addEventListener('click', () => {
        document.execCommand('insertUnorderedList', false, null);
        editor.focus();
    });
    
    document.getElementById('number-list-btn').addEventListener('click', () => {
        document.execCommand('insertOrderedList', false, null);
        editor.focus();
    });
    
    document.getElementById('decrease-indent-btn').addEventListener('click', () => {
        document.execCommand('outdent', false, null);
        editor.focus();
    });
    
    document.getElementById('increase-indent-btn').addEventListener('click', () => {
        document.execCommand('indent', false, null);
        editor.focus();
    });
    

    
    document.getElementById('insert-link-btn').addEventListener('click', () => {
        const url = prompt('Enter URL:');
        if (url) {
            document.execCommand('createLink', false, url);
     
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const links = range.commonAncestorContainer.querySelectorAll('a');
                links.forEach(link => {
                    if (link.href === url || link.contains(range.commonAncestorContainer)) {
                        link.target = '_blank';
                    }
                });
            }
        }
        editor.focus();
    });
    
    document.getElementById('insert-image-btn').addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        input.onchange = e => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    document.execCommand('insertImage', false, event.target.result);
                    saveCurrentState();
                    setTimeout(() => checkPageOverflow(), 500);
                };
                reader.readAsDataURL(file);
            }
        };
        
        input.click();
    });
    
    document.getElementById('insert-table-btn').addEventListener('click', () => {
        const rows = prompt('Enter number of rows:', '3');
        const cols = prompt('Enter number of columns:', '3');
        
        if (rows && cols) {
            let table = '<table style="width:100%; border-collapse: collapse;">';
            
            for (let i = 0; i < parseInt(rows); i++) {
                table += '<tr>';
                for (let j = 0; j < parseInt(cols); j++) {
                    table += '<td style="border: 1px solid #ddd; padding: 8px;">&nbsp;</td>';
                }
                table += '</tr>';
            }
            
            table += '</table><p></p>';
            document.execCommand('insertHTML', false, table);
            saveCurrentState();
            setTimeout(() => checkPageOverflow(), 500);
        }
        editor.focus();
    });
    

    
    document.getElementById('undo-btn').addEventListener('click', () => {
        if (undoStack.length > 1) {
            redoStack.push(undoStack.pop());
            editor.innerHTML = undoStack[undoStack.length - 1];
            updatePageNumbers();
            setTimeout(() => checkPageOverflow(), 100); // Add this line
        }
        editor.focus();
    });
    
    document.getElementById('redo-btn').addEventListener('click', () => {
        if (redoStack.length > 0) {
            const state = redoStack.pop();
            undoStack.push(state);
            editor.innerHTML = state;
            updatePageNumbers();
            setTimeout(() => checkPageOverflow(), 100); // Add this line
        }
        editor.focus();
    });
    

    
    document.getElementById('save-btn').addEventListener('click', () => {
        const documentName = prompt('Enter document name:', 'document');
        if (documentName) {
            localStorage.setItem(`document-${documentName}`, editor.innerHTML);
            alert(`Document "${documentName}" saved locally!`);
        }
        editor.focus();
    });
    
    document.getElementById('load-btn').addEventListener('click', () => {
    
        let savedDocs = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('document-') && key !== 'document-autosave') {
                savedDocs.push(key.replace('document-', ''));
            }
        }
        
        if (savedDocs.length > 0) {
            const docName = prompt(`Choose a document to open (${savedDocs.join(', ')}):`, savedDocs[0]);
            if (docName) {
                const content = localStorage.getItem(`document-${docName}`);
                if (content) {
                    if (confirm('Loading a document will replace your current work. Continue?')) {
                        editor.innerHTML = content;
                        saveCurrentState();
                        updatePageNumbers();
                        setTimeout(() => checkPageOverflow(), 100); // Add this line
                    }
                } else {
                    alert('Document not found!');
                }
            }
        } else {
        
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.html,.txt';
            
            input.onchange = e => {
                const file = e.target.files[0];
                const reader = new FileReader();
                reader.onload = function(event) {
                    if (confirm('Loading a document will replace your current work. Continue?')) {
                        editor.innerHTML = event.target.result;
                        saveCurrentState();
                        updatePageNumbers();
                        setTimeout(() => checkPageOverflow(), 100); // Add this line
                    }
                };
                reader.readAsText(file);
            };
            
            input.click();
        }
        editor.focus();
    });
    
    document.getElementById('export-btn').addEventListener('click', () => {
        const format = prompt('Export format (html, txt, doc):', 'doc');
        
        if (format === 'doc') {
            // Create Word-compatible HTML
            const wordContent = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" 
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
    <meta charset="utf-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <title>Document</title>
    <!--[if gte mso 9]>
    <xml>
        <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
    </xml>
    <![endif]-->
    <style>
        /* Word-specific styling */
        @page {
            size: 21.0cm 29.7cm; /* A4 */
            margin: 2.0cm 2.0cm 2.0cm 2.0cm; /* Margins */
        }
        body {
            font-family: "Times New Roman", Times, serif;
            line-height: 1.5;
            font-size: 12pt;
        }
        p { margin: 0 0 10pt 0; }
        table { border-collapse: collapse; width: 100%; }
        td, th { border: 1pt solid #000; padding: 5pt; }
        img { max-width: 100%; }
    </style>
</head>
<body>
    <div class="document-content">
        ${getCleanedContent()}
    </div>
</body>
</html>`;
            
            downloadFile('document.doc', wordContent, 'application/msword');
            
        } else if (format === 'html') {
      
            const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Exported Document</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 40px auto; padding: 0 20px; }
        img { max-width: 100%; }
        table { border-collapse: collapse; width: 100%; }
        td, th { border: 1px solid #ddd; padding: 8px; }
    </style>
</head>
<body>
    ${getCleanedContent()}
</body>
</html>`;
            
            downloadFile('document.html', htmlContent, 'text/html');
            
        } else if (format === 'txt') {
        
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = getCleanedContent();
            const textContent = tempDiv.textContent || tempDiv.innerText;
            downloadFile('document.txt', textContent, 'text/plain');
        }
        
        editor.focus();

        function getCleanedContent() {
 
            const tempContainer = document.createElement('div');
            tempContainer.innerHTML = editor.innerHTML;

            const pages = tempContainer.querySelectorAll('.page');
            let content = '';
            
            pages.forEach(page => {
                content += page.innerHTML;
            });
            
            return content;
        }
    });
    
    function downloadFile(filename, content, type) {
        const blob = new Blob([content], {type: type});
        const a = document.createElement('a');
        a.download = filename;
        a.href = URL.createObjectURL(blob);
        a.click();
    }

    function initializeEditor() {

        const savedContent = localStorage.getItem('document-autosave');
        
        if (savedContent) {
            editor.innerHTML = savedContent;
            
 
            if (!editor.querySelector('.page')) {
                wrapContentInPage();
            }
        } else {
           
            editor.innerHTML = '<div class="page"><p><br></p></div>';
        }
        updatePageNumbers();
        

        setTimeout(() => {
            isCheckingOverflow = false;
            checkPageOverflow();
        }, 1000);
    }
    
    function wrapContentInPage() {
        const content = editor.innerHTML;
        editor.innerHTML = `<div class="page">${content}</div>`;
    }

    document.getElementById('page-break-btn').addEventListener('click', () => {
        insertPageBreak();
        editor.focus();
    });

    function insertPageBreak() {
     
        const newPage = document.createElement('div');
        newPage.className = 'page';
        newPage.innerHTML = '<p><br></p>';
        

        const selection = window.getSelection();
        let currentPage = null;
        
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const container = range.commonAncestorContainer;
            currentPage = container.nodeType === 3 ? 
                container.parentNode.closest('.page') : 
                container.closest('.page');
            
            if (!currentPage && range.commonAncestorContainer.nodeType === 3) {

                currentPage = range.commonAncestorContainer.parentNode.closest('.page');
            }
        }
        

        if (!currentPage) {
            const pages = editor.querySelectorAll('.page');
            currentPage = pages[pages.length - 1];
        }
        

        if (currentPage && currentPage.parentNode === editor) {
            currentPage.after(newPage);
        } else {

            editor.appendChild(newPage);
        }
        
  
        const newPageFirstPara = newPage.querySelector('p');
        if (newPageFirstPara) {
            const range = document.createRange();
            range.setStart(newPageFirstPara, 0);
            range.collapse(true);
            
            selection.removeAllRanges();
            selection.addRange(range);
        }
        
        saveCurrentState(); 
        updatePageNumbers(); 
    }


    function checkPageOverflow() {
        // Prevent recursive calls
        if (isCheckingOverflow) return;
        
        isCheckingOverflow = true;
        
        const selection = window.getSelection();
        let savedRange = null;
        if (selection.rangeCount > 0) {
            savedRange = selection.getRangeAt(0).cloneRange();
        }
        
        const pages = editor.querySelectorAll('.page');
        let pageWasSplit = false;
        
        pages.forEach(page => {

            const maxHeight = 257; // in mm
            

            const maxHeightPx = maxHeight * 3.779; // 1mm ≈ 3.779px
            
            // Calculate content height more accurately
            let contentHeight = 0;
            Array.from(page.children).forEach(child => {
                contentHeight += child.offsetHeight;
            });
 
            if (contentHeight > maxHeightPx + 50) {

                splitOverflowingPage(page, maxHeightPx);
                pageWasSplit = true;
            }
        });
        
        if (pageWasSplit) {
            updatePageNumbers();
        }

        ensureCursorInCorrectPage();

        setTimeout(() => {
            isCheckingOverflow = false;
        }, 300);
    }


    function updatePageNumbers() {
        const pages = editor.querySelectorAll('.page');
        pages.forEach((page, index) => {
            page.setAttribute('data-page-number', index + 1);
        });
    }


    updatePageNumbers();


    editor.addEventListener('DOMContentLoaded', updatePageNumbers);

  
    document.getElementById('undo-btn').addEventListener('click', () => {
        if (undoStack.length > 1) {
            redoStack.push(undoStack.pop());
            editor.innerHTML = undoStack[undoStack.length - 1];
            updatePageNumbers(); // Add this line
        }
        editor.focus();
    });

    document.getElementById('redo-btn').addEventListener('click', () => {
        if (redoStack.length > 0) {
            const state = redoStack.pop();
            undoStack.push(state);
            editor.innerHTML = state;
            updatePageNumbers(); // Add this line
        }
        editor.focus();
    });


    function splitOverflowingPage(page, maxHeightPx) {

        if (page.children.length <= 1) {
   
            let contentHeight = 0;
            Array.from(page.children).forEach(child => {
                contentHeight += child.offsetHeight;
            });
            
            if (contentHeight < maxHeightPx * 1.5) {
                return; // Skip splitting for minor overflows
            }
        }
        
        const wasEditingThisPage = page.dataset.lastEditedPage === "true";

        maxHeightPx += 30; // Increased from 10px to 30px
        
        const newPage = document.createElement('div');
        newPage.className = 'page';

        if (wasEditingThisPage) {
            newPage.dataset.lastEditedPage = "true";
            page.removeAttribute('data-lastEditedPage');
        }

        page.after(newPage);

        const children = Array.from(page.children);
        let totalHeight = 0;
        let splitIndex = -1;
        
        for (let i = 0; i < children.length; i++) {
            totalHeight += children[i].offsetHeight;
            if (totalHeight > maxHeightPx) {
                splitIndex = i;
                break;
            }
        }

        if (splitIndex > 0 && splitIndex < children.length - 1) {

            for (let i = children.length - 1; i >= splitIndex; i--) {
                if (newPage.firstChild) {
                    newPage.insertBefore(children[i], newPage.firstChild);
                } else {
                    newPage.appendChild(children[i]);
                }
            }
        } else if (splitIndex === 0 && children.length > 1) {

            const midPoint = Math.floor(children.length / 2);
            for (let i = children.length - 1; i >= midPoint; i--) {
                if (newPage.firstChild) {
                    newPage.insertBefore(children[i], newPage.firstChild);
                } else {
                    newPage.appendChild(children[i]);
                }
            }
        } else {

            newPage.innerHTML = '<p><br></p>';
        }
        
        if (!newPage.firstChild) {
            newPage.innerHTML = '<p><br></p>';
        }

        if (newPage.textContent.trim() === '') {
            if (page.scrollHeight <= maxHeightPx * 1.1) {

                newPage.remove();
                return; // Exit without saving state
            }
        }
        
        saveCurrentState(); 
    }

    function updateToolbarState() {
        document.getElementById('bold-btn').classList.toggle('active', document.queryCommandState('bold'));
        
        document.getElementById('italic-btn').classList.toggle('active', document.queryCommandState('italic'));
        
        document.getElementById('underline-btn').classList.toggle('active', document.queryCommandState('underline'));

        document.getElementById('strikethrough-btn').classList.toggle('active', document.queryCommandState('strikeThrough'));

        document.getElementById('align-left-btn').classList.toggle('active', document.queryCommandState('justifyLeft'));
        document.getElementById('align-center-btn').classList.toggle('active', document.queryCommandState('justifyCenter'));
        document.getElementById('align-right-btn').classList.toggle('active', document.queryCommandState('justifyRight'));
        document.getElementById('align-justify-btn').classList.toggle('active', document.queryCommandState('justifyFull'));
    }


    editor.addEventListener('click', updateToolbarState);
    editor.addEventListener('keyup', updateToolbarState);
    editor.addEventListener('mouseup', updateToolbarState);
    editor.addEventListener('focus', updateToolbarState);
});

// Improved cursor restoration function
function ensureCursorInCorrectPage() {
    const lastEditedPage = document.querySelector('.page[data-lastEditedPage="true"]');
    
    if (lastEditedPage) {
        const selection = window.getSelection();
        
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const container = range.commonAncestorContainer;
            const currentPage = container.nodeType === 3 ? 
                container.parentNode.closest('.page') : 
                container.closest('.page');

            if (currentPage !== lastEditedPage) {
                const paragraphs = Array.from(lastEditedPage.querySelectorAll('p'));
                if (paragraphs.length) {
                    // Get the last paragraph
                    const paragraph = paragraphs[paragraphs.length - 1];

                    const newRange = document.createRange();

                    if (paragraph.lastChild && paragraph.lastChild.nodeType === 3) {

                        newRange.setStart(paragraph.lastChild, paragraph.lastChild.length);
                    } else {
                       
                        newRange.setStart(paragraph, 0);
                    }
                    
                    newRange.collapse(true);
                    selection.removeAllRanges();
                    selection.addRange(newRange);
                    
                    paragraph.scrollIntoView({ behavior: 'smooth', block: 'end' });
                }
            }
        }
    }
}


function protectCursor() {
    const pages = document.querySelectorAll('.page');
    if (pages.length < 2) return; // No protection needed
    
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    const currentPage = container.nodeType === 3 ? 
        container.parentNode.closest('.page') : 
        container.closest('.page');
    
    if (currentPage) {

        pages.forEach(p => p.removeAttribute('data-lastEditedPage'));

        currentPage.dataset.lastEditedPage = "true";
    }
}