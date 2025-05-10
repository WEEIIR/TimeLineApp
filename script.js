const timelinesBody = document.getElementById('timelinesBody');

    function syncGrid() {
      const rows = Array.from(timelinesBody.querySelectorAll('.timeline-items'));
      if (!rows.length) return;
      const colCount = rows.reduce((max, row) => Math.max(max, row.children.length), 0);
      const widths = [];
      for (let i = 0; i < colCount; i++) {
        let maxW = 0;
        rows.forEach(row => {
          const it = row.children[i];
          if (it) maxW = Math.max(maxW, it.getBoundingClientRect().width);
        });
        widths.push(maxW + 'px');
      }
      rows.forEach(row => row.style.gridTemplateColumns = widths.join(' '));
    }

    const mo = new MutationObserver(syncGrid);
    mo.observe(timelinesBody, { childList: true, subtree: true });
    const resizeObserver = new ResizeObserver(syncGrid);

    document.getElementById('addTimelineBtn').addEventListener('click', () => createTimeline());

    function createTimeline(source = null) {
      const tr = document.createElement('tr');
      const ctrlTd = document.createElement('td'); ctrlTd.className = 'controls-cell';
      ctrlTd.innerHTML = `
        <label>Başlık:<br><input type="text" class="timeline-title" placeholder="Başlık"></label><br>
        <button class="add-item-btn">+ Item</button>
        <button class="group-btn">⊞ Group</button>
        <button class="duplicate-btn">⎘</button>
        <button class="remove-tl-btn">✕</button>
      `;
      tr.appendChild(ctrlTd);

      const itemsTd = document.createElement('td');
      const itemsDiv = document.createElement('div'); itemsDiv.className = 'timeline-items';
      itemsTd.appendChild(itemsDiv); tr.appendChild(itemsTd);

      ctrlTd.querySelector('.add-item-btn').addEventListener('click', () => addItem(itemsDiv));
      ctrlTd.querySelector('.remove-tl-btn').addEventListener('click', () => { tr.remove(); syncGrid(); });
      ctrlTd.querySelector('.duplicate-btn').addEventListener('click', () => { createTimeline(tr); syncGrid(); });
      ctrlTd.querySelector('.group-btn').addEventListener('click', () => groupSelected(itemsDiv));

      if (source) {
        ctrlTd.querySelector('.timeline-title').value = source.querySelector('.timeline-title').value;
        source.querySelectorAll('.timeline-item, .item-group').forEach(it => {
          const clone = it.classList.contains('item-group') ? cloneGroup(it) : makeItem(it.querySelector('span').innerText, it.style.width);
          itemsDiv.appendChild(clone);
        });
      }

      timelinesBody.appendChild(tr);
      requestAnimationFrame(syncGrid);
      return tr;
    }

    function addItem(container) {
      const it = makeItem('Yeni Item', '120px'); container.appendChild(it);
    }

    function makeItem(text, width) {
      const it = document.createElement('div'); it.className = 'timeline-item'; it.style.width = width;
      const span = document.createElement('span'); span.contentEditable = true; span.innerText = text;
      span.addEventListener('input', () => resizeItem(it, span));
      const rm = document.createElement('div'); rm.className = 'remove-btn'; rm.innerText = '×';
      rm.addEventListener('click', () => { it.remove(); syncGrid(); });
      it.appendChild(span); it.appendChild(rm);
      it.addEventListener('click', e => { if (e.ctrlKey) it.classList.toggle('selected'); });
      resizeObserver.observe(it);
      return it;
    }

    function resizeItem(itemDiv, span) {
      const text = span.innerText || '';
      itemDiv.style.width = text.length * 12 + 20 + 'px';
      syncGrid();
    }

    function groupSelected(container) {
      const selected = Array.from(container.querySelectorAll('.timeline-item.selected:not(.item-group-item)'));
      if (selected.length < 2) return;

      const group = document.createElement('div');
      group.className = 'timeline-item item-group';
      group.style.display = 'flex';
      group.style.gap = '4px';
      group.style.alignItems = 'center';
      group.style.flexWrap = 'wrap';

      selected.forEach(it => {
        const clone = it.cloneNode(true);
        clone.classList.add('item-group-item');
        clone.classList.remove('selected');

        const ejectBtn = document.createElement('div');
        ejectBtn.innerText = '⤴';
        ejectBtn.title = 'Gruptan çıkar';
        ejectBtn.style.marginLeft = '4px';
        ejectBtn.style.cursor = 'pointer';
        ejectBtn.style.color = '#dc3545';
        ejectBtn.addEventListener('click', () => {
          const idx = Array.from(container.children).indexOf(group);
          clone.classList.remove('item-group-item');
          group.removeChild(clone);
          container.insertBefore(clone, container.children[idx + 1] || null);
          syncGrid();
        });

        clone.appendChild(ejectBtn);
        group.appendChild(clone);
      });

      // Grup kontrol düğmeleri
      const groupControls = document.createElement('div');
      groupControls.style.display = 'flex';
      groupControls.style.flexDirection = 'column';
      groupControls.style.marginLeft = '8px';

      const addToGroupBtn = document.createElement('button');
      addToGroupBtn.innerText = '+ Item Ekle';
      addToGroupBtn.addEventListener('click', () => {
        const newItem = makeItem('Yeni', '100px');
        newItem.classList.add('item-group-item');

        const ejectBtn = document.createElement('div');
        ejectBtn.innerText = '⤴';
        ejectBtn.title = 'Gruptan çıkar';
        ejectBtn.style.marginLeft = '4px';
        ejectBtn.style.cursor = 'pointer';
        ejectBtn.style.color = '#dc3545';
        ejectBtn.addEventListener('click', () => {
          const idx = Array.from(container.children).indexOf(group);
          newItem.classList.remove('item-group-item');
          group.removeChild(newItem);
          container.insertBefore(newItem, container.children[idx + 1] || null);
          syncGrid();
        });

        newItem.appendChild(ejectBtn);
        group.insertBefore(newItem, groupControls);
        syncGrid();
      });

      const deleteGroupBtn = document.createElement('button');
      deleteGroupBtn.innerText = 'Grubu Sil';
      deleteGroupBtn.style.backgroundColor = '#dc3545';
      deleteGroupBtn.addEventListener('click', () => {
        const idx = Array.from(container.children).indexOf(group);
        const items = Array.from(group.children).filter(el => el.classList.contains('timeline-item'));
        items.forEach(it => {
          it.classList.remove('item-group-item');
          it.querySelector('.remove-btn')?.remove(); // Çakışmayı önle
          it.querySelector('div[title="Gruptan çıkar"]')?.remove();
          container.insertBefore(it, container.children[idx] || null);
        });
        group.remove();
        syncGrid();
      });

      groupControls.appendChild(addToGroupBtn);
      groupControls.appendChild(deleteGroupBtn);
      group.appendChild(groupControls);

      const items = Array.from(container.children);
      selected.forEach(it => it.remove());
      const insertIdx = selected.map(it => items.indexOf(it)).sort((a, b) => a - b)[0];
      container.insertBefore(group, container.children[insertIdx] || null);
      syncGrid();
    }

    function cloneGroup(src) {
      const grp = makeItem(src.querySelector('span').innerText, src.style.width);
      grp.classList.add('item-group');
      return grp;
    }

    createTimeline();


    document.getElementById('saveBtn').addEventListener('click', async () => {
  const data = Array.from(timelinesBody.children).map(tr => {
    const title = tr.querySelector('.timeline-title').value;
    const items = Array.from(tr.querySelectorAll('.timeline-items > *')).map(it => {
      if (it.classList.contains('item-group')) {
        return {
          type: 'group',
          items: Array.from(it.children).map(child => ({
            type: 'item',
            text: child.querySelector('span')?.innerText,
            width: child.style.width
          }))
        };
      } else {
        return {
          type: 'item',
          text: it.querySelector('span')?.innerText,
          width: it.style.width
        };
      }
    });
    return { title, items };
  });

  await window.electronAPI.saveTimeline(data);
});

document.getElementById('loadBtn').addEventListener('click', async () => {
  const data = await window.electronAPI.loadTimeline();
  if (!data) return;

  timelinesBody.innerHTML = '';
  data.forEach(timeline => {
    const tr = createTimeline();
    tr.querySelector('.timeline-title').value = timeline.title;
    const container = tr.querySelector('.timeline-items');
    timeline.items.forEach(item => {
      if (item.type === 'item') {
        const it = makeItem(item.text, item.width);
        container.appendChild(it);
      } else if (item.type === 'group') {
        const group = document.createElement('div');
        group.className = 'timeline-item item-group';
        group.style.display = 'flex';
        group.style.gap = '4px';
        group.style.alignItems = 'center';

        item.items.forEach(child => {
          const it = makeItem(child.text, child.width);
          it.classList.add('item-group-item');
          group.appendChild(it);
        });
        container.appendChild(group);
      }
    });
  });
});
