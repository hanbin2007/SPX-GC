(function () {
  'use strict';

  const root = document.getElementById('studio');
  const project = root.dataset.project;
  const rundown = root.dataset.rundown;
  const endpoint = `/api/studio/${encodeURIComponent(project)}/${encodeURIComponent(rundown)}`;
  const $ = (id) => document.getElementById(id);
  let state = null;
  let selectedItemId = null;
  let selectedSourceId = null;
  let activeView = 'playout';
  let bindingDraft = null;
  let bindingDirty = false;
  let logoDraft = null;
  let logoDirty = false;
  let sourceDraft = null;
  let sourceDirty = false;
  let fieldTable = null;
  let itemSourceTable = null;
  let sourceTable = null;
  let rangeAnchor = null;
  let toastTimer = 0;
  let logoAssets = [];
  let selectedLogoGroup = '1';
  let selectedLogoSlot = 1;
  const logoGroupFields = ['f4', 'f15', 'f25', 'f35', 'f45', 'f55', 'f65'];

  async function api(path = '', method = 'GET', body) {
    const response = await fetch(endpoint + path, {
      method,
      credentials: 'same-origin',
      headers: body ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined
    });
    if (!response.ok) {
      if (response.status === 401) {
        if (bindingDirty || sourceDirty) throw new Error('登录已过期，请在新标签页重新登录后再保存');
        location.assign(`/login?next=${encodeURIComponent(location.pathname + location.search)}`);
        throw new Error('登录已过期');
      }
      const result = await response.json().catch(() => ({}));
      throw new Error(result.error || `HTTP ${response.status}`);
    }
    const content = response.headers.get('content-type') || '';
    return content.includes('application/json') ? response.json() : null;
  }

  function toast(message, error = false) {
    const node = $('toast');
    node.textContent = message;
    node.classList.toggle('is-error', error);
    node.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => node.classList.remove('is-visible'), 3500);
  }

  function itemById(id) {
    return state?.items.find((item) => String(item.itemID) === String(id));
  }

  function isLogoLibrary(item) {
    return /(?:^|\/)custom\/czgz-md3\/CZ_BUG\.html$/i.test(String(item?.relpath || ''));
  }

  function sourceById(id) {
    return state?.sources.sources.find((source) => source.id === id);
  }

  function projectLogoValues(library = state?.logoLibrary) {
    if (!library) return {};
    const values = { ...library.values };
    const row = sourceById(library.sourceId)?.rows[library.rowIndex] || {};
    for (const field of logoGroupFields) {
      const column = library.fieldColumns?.[field];
      if (column) values[field] = String(row[column] ?? '');
    }
    return values;
  }

  function cardName(item) {
    const name = item.description || item.relpath?.split('/').pop()?.replace(/\.html?$/, '') || '包装';
    return name.replace(/^常高 M3 · /, '').replace(/（[^）]*）$/, '').trim();
  }

  function effective(item, binding = state?.bindings.items[item.itemID]) {
    const values = Object.fromEntries((item.DataFields || []).filter((field) => field.field)
      .map((field) => [field.field, String(field.value ?? '')]));
    if (!binding) return values;
    Object.assign(values, binding.manualValues || {});
    const source = sourceById(binding.sourceId);
    if (!source) return values;
    const row = source.rows[binding.mode === 'range' ? binding.rangeStart - 1 : binding.rowIndex] || {};
    for (const [field, column] of Object.entries(binding.fieldColumns || {})) {
      if (column) values[field] = String(row[column] ?? '');
    }
    if (binding.mode === 'range' && binding.rangeField && binding.rangeTextColumn) {
      values[binding.rangeField] = source.rows.slice(binding.rangeStart - 1, binding.rangeEnd).map((entry) => {
        const text = String(entry[binding.rangeTextColumn] ?? '').trim();
        const time = binding.rangeTimeColumn ? String(entry[binding.rangeTimeColumn] ?? '').trim() : '';
        return time && text ? `${time} | ${text}` : (text || time);
      }).filter(Boolean).join('\n');
    }
    return values;
  }

  function iconButton(icon, label, className, handler, disabled = false) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = className;
    button.title = label;
    button.setAttribute('aria-label', label);
    button.disabled = disabled;
    button.innerHTML = `<i class="${icon}" aria-hidden="true"></i><span>${label}</span>`;
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      handler();
    });
    return button;
  }

  function renderCards() {
    if (!state) return;
    const search = $('itemSearch').value.trim().toLowerCase();
    const layer = $('layerFilter').value;
    const grid = $('itemGrid');
    grid.replaceChildren();
    const items = state.items.filter((item) => {
      const binding = state.bindings.items[item.itemID];
      const values = effective(item, binding);
      return (!layer || String(binding?.outputLayer || item.webplayout) === layer) &&
        (!search || `${item.description} ${Object.values(values).join(' ')}`.toLowerCase().includes(search));
    });
    $('itemCount').textContent = `${items.length} / ${state.items.length} 个包装`;
    if (!items.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-grid';
      empty.textContent = '没有匹配的包装';
      grid.append(empty);
      return;
    }
    for (const item of items) {
      const binding = state.bindings.items[item.itemID];
      const source = sourceById(binding?.sourceId);
      const values = effective(item, binding);
      const projectLogos = isLogoLibrary(item) ? projectLogoValues() : null;
      const missingData = Boolean((source && !source.rows.length) ||
        (binding?.mode === 'range' && binding.rangeField && !values[binding.rangeField]));
      const noOutput = (binding?.outputLayer || item.webplayout) === '-' &&
        (!item.playserver || item.playserver === '-');
      const card = document.createElement('article');
      const onAir = item.onair === 'true';
      card.className = `item-card${onAir ? ' is-onair' : ''}${selectedItemId === item.itemID ? ' is-selected' : ''}`;
      const open = document.createElement('button');
      open.className = 'item-open';
      open.type = 'button';
      open.setAttribute('aria-label', `配置 ${cardName(item)}`);
      open.setAttribute('aria-pressed', String(selectedItemId === item.itemID));
      open.addEventListener('click', () => selectItem(item.itemID));
      const head = document.createElement('div');
      head.className = 'card-head';
      const title = document.createElement('strong');
      title.textContent = cardName(item);
      const layerChip = document.createElement('span');
      layerChip.className = 'layer-chip';
      layerChip.textContent = `${binding?.outputLayer || item.webplayout || '-'} 层`;
      head.append(title, layerChip);
      const subtitle = document.createElement('div');
      subtitle.className = 'card-subtitle';
      subtitle.textContent = item.description || '';
      const preview = document.createElement('div');
      preview.className = 'card-data';
      const fields = isLogoLibrary(item)
        ? [
          { title: '角标跟随', field: 'f6', display: values.f6 === 'school' ? '学校标志' : `${values.f6 || '1'} 组` },
          ...['1', '2'].map((group) => ({ title: `${group} 组`, display: [0, 1, 2, 3, 4, 5, 6]
            .filter((index) => (index === 0 || projectLogos[`f${index}0`]) &&
              logoGroups(projectLogos[index === 0 ? 'f4' : `f${index}5`]).includes(group))
            .map((index) => index === 0 ? '学校标志' :
              (projectLogos[`f${index}1`] || projectLogos[`f${index}0`].split('/').pop()?.replace(/\.[^.]+$/, '')))
            .join('、') || '学校标志（默认）' }))
        ]
        : (item.DataFields || []).filter((field) => field.field && values[field.field] &&
          !['hidden', 'button'].includes(field.ftype)).slice(0, 3);
      for (const field of fields) {
        const line = document.createElement('div');
        line.className = 'card-data-line';
        const label = document.createElement('span');
        label.textContent = field.title || field.field;
        const value = document.createElement('b');
        const full = field.display ?? values[field.field];
        value.textContent = full.split('\n')[0] + (full.includes('\n') ? `  +${full.split('\n').length - 1}` : '');
        line.append(label, value);
        preview.append(line);
      }
      if (!fields.length) {
        const line = document.createElement('div');
        line.className = 'card-data-line';
        line.textContent = '尚无播出内容';
        preview.append(line);
      }
      const footer = document.createElement('div');
      footer.className = 'card-footer';
      const sourceName = document.createElement('span');
      sourceName.className = 'card-source';
      sourceName.textContent = missingData ? '无可播数据' : noOutput ? '未配置输出' :
        (isLogoLibrary(item) ? (state.logoLibrary?.sourceId ? `所属组：${sourceById(state.logoLibrary.sourceId)?.name || '数据源'}` : '项目标志组') : (source ? source.name : '手动数据'));
      footer.append(sourceName);
      if (selectedItemId === item.itemID) {
        const selected = document.createElement('span');
        selected.className = 'selected-tag';
        selected.textContent = '选中';
        footer.append(selected);
      }
      if (onAir) {
        const live = document.createElement('span');
        live.className = 'live-tag';
        live.textContent = '播出中';
        footer.append(live);
      }
      open.append(head, subtitle, preview, footer);
      const controls = document.createElement('div');
      controls.className = 'card-actions';
      controls.append(
        iconButton('fas fa-play', '播出', 'play-action', () => action(item, 'play'), missingData || noOutput),
        iconButton('fas fa-stop', '收起', 'stop-action', () => action(item, 'stop'), !onAir || (binding?.out || item.out) === 'none'),
        iconButton('fas fa-sync-alt', '更新', '', () => action(item, 'update'), !onAir),
        iconButton('fas fa-step-forward', '下一步', '', () => action(item, 'next'), !onAir || Number(item.steps) <= 1)
      );
      card.append(open, controls);
      grid.append(card);
    }
    if (window.FontAwesome?.dom?.i2svg) window.FontAwesome.dom.i2svg({ node: grid });
  }

  async function loadState(preserveDraft = true) {
    const next = await api();
    state = next;
    renderCards();
    renderSourceList();
    if (!preserveDraft || !logoDirty) {
      logoDraft = state.logoLibrary ? structuredClone(state.logoLibrary) : null;
      $('tabLogos').disabled = !logoDraft;
      $('logoEditor').hidden = !logoDraft;
      $('logoLibraryStatus').textContent = logoDraft ? '已保存' : '';
      if (logoDraft) renderLogoEditor();
    }
    if (selectedItemId && (!preserveDraft || !bindingDirty)) renderInspector();
    if (selectedSourceId && (!preserveDraft || !sourceDirty)) renderSourceEditor();
  }

  async function action(item, command) {
    try {
      if (sourceDirty) await saveSource();
      if (logoDirty) await saveLogoLibrary();
      if (bindingDirty && selectedItemId === item.itemID) await saveBinding();
      await api(`/items/${encodeURIComponent(item.itemID)}/action`, 'POST', { action: command });
      await loadState();
      toast(`${cardName(item)}：${{ play: '已播出', stop: '已收起', update: '已更新', next: '已继续' }[command]}`);
    } catch (error) { toast(error.message, true); }
  }

  function editableFields(item) {
    return (item.DataFields || []).filter((field) => field.field &&
      !['instruction', 'divider', 'button'].includes(field.ftype));
  }

  function defaultBinding(item) {
    const manualValues = {};
    for (const field of editableFields(item)) manualValues[field.field] = String(field.value ?? '');
    const listField = editableFields(item).find((field) => field.ftype === 'textarea');
    return {
      sourceId: '', mode: 'row', rowIndex: 0, rangeStart: 1, rangeEnd: 1,
      rangeField: listField?.field || '', rangeTextColumn: '', rangeTimeColumn: '',
      fieldColumns: {}, manualValues,
      outputLayer: /^[1-5]$/.test(String(item.webplayout)) ? String(item.webplayout) : '-',
      out: item.out === 'none' || /^\d+$/.test(String(item.out)) ? String(item.out) : 'manual'
    };
  }

  function optionList(select, choices, selected) {
    select.replaceChildren();
    for (const [value, label] of choices) {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = label;
      select.append(option);
    }
    select.value = selected ?? '';
  }

  function captureFields() {
    if (!fieldTable || !bindingDraft) return;
    for (const row of fieldTable.getData()) {
      bindingDraft.fieldColumns[row.field] = row.mapping || '';
      bindingDraft.manualValues[row.field] = String(row.manual ?? '');
    }
  }

  function markBindingDirty() {
    bindingDirty = true;
    $('bindingStatus').textContent = '未保存';
  }

  function updateDraftControls() {
    if (!bindingDraft) return;
    if (!isLogoLibrary(itemById(selectedItemId))) {
      bindingDraft.sourceId = $('itemSource').value;
      bindingDraft.mode = $('itemMode').value;
      bindingDraft.rowIndex = Math.max(0, Number($('itemRow').value) - 1 || 0);
      bindingDraft.rangeStart = Math.max(1, Number($('rangeStart').value) || 1);
      bindingDraft.rangeEnd = Math.max(bindingDraft.rangeStart, Number($('rangeEnd').value) || bindingDraft.rangeStart);
      bindingDraft.rangeField = $('rangeField').value;
      bindingDraft.rangeTextColumn = $('rangeTextColumn').value;
      bindingDraft.rangeTimeColumn = $('rangeTimeColumn').value;
    }
    bindingDraft.outputLayer = $('outputLayer').value;
    bindingDraft.out = $('itemOut').value === 'timer'
      ? String(Math.max(1, Number($('timeoutSeconds').value) || 1) * 1000)
      : $('itemOut').value;
    $('timeoutField').hidden = $('itemOut').value !== 'timer';
    markBindingDirty();
    if (!isLogoLibrary(itemById(selectedItemId))) highlightRange();
  }

  function highlightRange() {
    if (!itemSourceTable || !bindingDraft) return;
    itemSourceTable.getRows().forEach((row) => {
      const position = row.getData()._position;
      const selected = bindingDraft.mode === 'range'
        ? position >= bindingDraft.rangeStart && position <= bindingDraft.rangeEnd
        : position === bindingDraft.rowIndex + 1;
      row.getElement().classList.toggle('is-in-range', selected);
    });
    const count = bindingDraft.mode === 'range'
      ? Math.max(0, bindingDraft.rangeEnd - bindingDraft.rangeStart + 1) : 1;
    $('rangeCount').textContent = `${count} / ${itemSourceTable.getData().length} 行`;
  }

  function renderItemSourceTable() {
    if (itemSourceTable) { itemSourceTable.destroy(); itemSourceTable = null; }
    const source = sourceById(bindingDraft?.sourceId);
    $('itemSourceTable').hidden = !source;
    $('rangePreviewHeading').hidden = !source;
    if (!source) return;
    const columns = source.columns.map((column) => ({
      title: escapeHTML(column.title), field: column.key, formatter: 'plaintext',
      headerSort: false, minWidth: 90
    }));
    itemSourceTable = new Tabulator('#itemSourceTable', {
      data: source.rows.map((row, index) => ({ ...row, _position: index + 1 })),
      index: '_id', height: Math.min(230, 44 + source.rows.length * 33),
      layout: 'fitColumns', rowHeader: { formatter: 'rownum', width: 38, headerSort: false },
      rowFormatter: (row) => {
        const position = row.getData()._position;
        row.getElement().classList.toggle('is-in-range', bindingDraft.mode === 'range'
          ? position >= bindingDraft.rangeStart && position <= bindingDraft.rangeEnd
          : position === bindingDraft.rowIndex + 1);
      },
      columns
    });
    itemSourceTable.on('rowClick', (event, row) => {
      const position = row.getData()._position;
      if (bindingDraft.mode === 'range') {
        if (event.shiftKey && rangeAnchor) {
          bindingDraft.rangeStart = Math.min(rangeAnchor, position);
          bindingDraft.rangeEnd = Math.max(rangeAnchor, position);
        } else {
          rangeAnchor = position;
          bindingDraft.rangeStart = position;
          bindingDraft.rangeEnd = position;
        }
        $('rangeStart').value = bindingDraft.rangeStart;
        $('rangeEnd').value = bindingDraft.rangeEnd;
      } else {
        bindingDraft.rowIndex = position - 1;
        $('itemRow').value = position;
      }
      markBindingDirty();
      highlightRange();
    });
    itemSourceTable.on('tableBuilt', highlightRange);
  }

  function renderFieldTable(item) {
    if (fieldTable) { fieldTable.destroy(); fieldTable = null; }
    const source = sourceById(bindingDraft.sourceId);
    const isRangeField = (row) => Boolean(source && bindingDraft.mode === 'range' &&
      bindingDraft.rangeTextColumn && row.field === bindingDraft.rangeField);
    const isDerived = (row) => Boolean(source && (row.mapping || isRangeField(row)));
    const labels = { '': '手动' };
    for (const column of source?.columns || []) labels[column.key] = column.title;
    const fields = editableFields(item).map((field) => ({
      field: field.field, title: field.title || field.field, type: field.ftype || 'text',
      mapping: bindingDraft.fieldColumns?.[field.field] || '',
      manual: bindingDraft.manualValues?.[field.field] ?? String(field.value ?? '')
    }));
    fieldTable = new Tabulator('#fieldTable', {
      data: fields,
      index: 'field',
      height: Math.min(330, 42 + fields.length * 34),
      layout: 'fitColumns',
      columnDefaults: { headerSort: false, resizable: true },
      columns: [
        { title: '字段', field: 'title', widthGrow: 1.5, minWidth: 90, formatter: 'plaintext' },
        { title: '来源列', field: 'mapping', widthGrow: 1, minWidth: 75,
          editor: 'list', editable: (cell) => Boolean(source) && !isRangeField(cell.getRow().getData()),
          editorParams: { values: labels },
          formatter: (cell) => {
            const range = isRangeField(cell.getRow().getData());
            cell.getElement().classList.toggle('is-readonly', range || !source);
            const text = document.createElement('span');
            text.textContent = range ? '所选范围' : (labels[cell.getValue()] || '手动');
            return text;
          } },
        { title: '手动值', field: 'manual', widthGrow: 1.6, minWidth: 115,
          editor: 'textarea', editable: (cell) => cell.getRow().getData().type !== 'checkbox' &&
            !isDerived(cell.getRow().getData()),
          formatter: (cell) => {
            const row = cell.getRow().getData();
            const derived = isDerived(row);
            cell.getElement().classList.toggle('is-readonly', derived);
            if (derived) {
              const text = document.createElement('span');
              text.textContent = '由数据源提供';
              return text;
            }
            if (row.type !== 'checkbox') {
              const text = document.createElement('span');
              text.textContent = String(cell.getValue() ?? '').replace(/\n/g, ' / ');
              return text;
            }
            const check = document.createElement('input');
            check.type = 'checkbox';
            check.checked = String(cell.getValue()) === '1';
            check.setAttribute('aria-label', row.title);
            check.addEventListener('click', (event) => event.stopPropagation());
            check.addEventListener('change', () => cell.setValue(check.checked ? '1' : '0'));
            return check;
          } }
      ]
    });
    fieldTable.on('cellEdited', (cell) => {
      captureFields();
      markBindingDirty();
      if (cell.getField() === 'mapping') renderFieldTable(item);
    });
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[char]);
  }

  function logoValue(field) {
    return String(projectLogoValues(logoDraft)[field] ?? '');
  }

  function setLogoValue(field, value) {
    logoDraft.values[field] = String(value);
    markLogoDirty();
  }

  function markLogoDirty() {
    logoDirty = true;
    $('logoLibraryStatus').textContent = '未保存';
  }

  function logoGroups(value) {
    return ['1', '2', '3', '4'].filter((group) => String(value || '').includes(group));
  }

  function logoAsset(value) {
    return logoAssets.find((asset) => asset.value === value) || null;
  }

  function logoPreview(value, school = false) {
    const url = school ? '/templates/custom/czgz-md3/img/emblem-mark.png' : logoAsset(value)?.url;
    return url ? `<img src="${escapeHTML(url)}" alt="">` : '<i class="far fa-image" aria-hidden="true"></i>';
  }

  function logoTitle(index) {
    if (index === 0) return '学校标志';
    const name = logoValue(`f${index}1`).trim();
    const asset = logoAsset(logoValue(`f${index}0`));
    return name && name !== '-' ? name : (asset?.name.replace(/\.[^.]+$/, '') || `图片 ${index}`);
  }

  function prepareBugDraft(item) {
    const resolved = effective(item, bindingDraft);
    for (const [field, column] of Object.entries(bindingDraft.fieldColumns || {})) {
      if (column) {
        bindingDraft.manualValues[field] = resolved[field] ?? '';
        bindingDraft.fieldColumns[field] = '';
      }
    }
    if (bindingDraft.mode !== 'row' || bindingDraft.rangeField || bindingDraft.rangeTextColumn || bindingDraft.rangeTimeColumn) {
      bindingDraft.mode = 'row';
      bindingDraft.rangeField = '';
      bindingDraft.rangeTextColumn = '';
      bindingDraft.rangeTimeColumn = '';
    }
    if (bindingDraft.sourceId) {
      bindingDraft.sourceId = '';
    }
  }

  function renderLogoGroupTabs() {
    const node = $('logoGroupTabs');
    node.replaceChildren();
    for (const group of ['1', '2', '3', '4']) {
      const count = logoGroupFields.filter((field, index) =>
        (index === 0 || logoValue(`f${index}0`)) && logoGroups(logoValue(field)).includes(group)).length;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = group === selectedLogoGroup ? 'is-active' : '';
      button.setAttribute('role', 'tab');
      button.setAttribute('aria-selected', String(group === selectedLogoGroup));
      button.innerHTML = `<strong>${group} 组</strong><small>${count ? `${count} 个` : '默认'}</small>`;
      button.addEventListener('click', () => {
        selectedLogoGroup = group;
        renderLogoGroupTabs();
        renderLogoGroupPanel();
      });
      node.append(button);
    }
  }

  function renderLogoGroupPanel() {
    const group = selectedLogoGroup;
    const modeField = `f${68 + Number(group) * 2}`;
    const intervalField = `f${69 + Number(group) * 2}`;
    const members = logoGroupFields.map((field, index) => ({ field, index,
      available: index === 0 || Boolean(logoValue(`f${index}0`)),
      selected: logoGroups(logoValue(field)).includes(group),
      mapped: Boolean(logoDraft.fieldColumns[field])
    }));
    const selected = members.filter((entry) => entry.available && entry.selected);
    $('logoGroupSummary').textContent = selected.length
      ? `当前包含 ${selected.map((entry) => logoTitle(entry.index)).join('、')}`
      : '当前使用学校标志（默认）';
    $('logoGroupMode').value = logoValue(modeField) || 'auto';
    $('logoGroupInterval').value = logoValue(intervalField) || '8';
    $('logoGroupInterval').disabled = $('logoGroupMode').value !== 'auto';
    $('logoSchoolDwell').value = logoValue('f5');
    const container = $('logoGroupMembers');
    container.replaceChildren();
    for (const entry of members) {
      const row = document.createElement('div');
      row.className = `logo-member${entry.selected && entry.available ? ' is-member' : ''}`;
      const label = document.createElement('label');
      const check = document.createElement('input');
      check.type = 'checkbox';
      check.checked = entry.selected && entry.available;
      check.disabled = entry.mapped || !entry.available;
      check.setAttribute('aria-label', `${logoTitle(entry.index)}加入 ${group} 组`);
      check.addEventListener('change', () => {
        const groups = logoGroups(logoDraft.values[entry.field]);
        const next = check.checked ? [...new Set([...groups, group])] : groups.filter((value) => value !== group);
        setLogoValue(entry.field, next.sort().join(' '));
        renderLogoGroupTabs();
        renderLogoGroupPanel();
        renderLogoSlots();
        renderLogoSlotEditor();
      });
      const image = document.createElement('span');
      image.className = 'logo-member-image';
      image.innerHTML = logoPreview(entry.index ? logoValue(`f${entry.index}0`) : '', entry.index === 0);
      const text = document.createElement('span');
      text.className = 'logo-member-text';
      text.innerHTML = `<strong>${escapeHTML(logoTitle(entry.index))}</strong><small>${entry.mapped ? '数据源决定所属组' : !entry.available ? '未选图片' : entry.selected ? '本组播放' : '未加入本组'}</small>`;
      label.append(check, image, text);
      row.append(label);
      if (entry.index) {
        const edit = document.createElement('button');
        edit.type = 'button';
        edit.className = 'logo-member-edit';
        edit.title = `设置图片 ${entry.index}`;
        edit.setAttribute('aria-label', edit.title);
        edit.innerHTML = '<i class="fas fa-pen" aria-hidden="true"></i>';
        edit.addEventListener('click', () => {
          selectedLogoSlot = entry.index;
          renderLogoSlots();
          renderLogoSlotEditor();
          $('logoSlotEditor').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        });
        row.append(edit);
      }
      container.append(row);
    }
  }

  function renderLogoSlots() {
    const container = $('logoSlots');
    container.replaceChildren();
    for (let index = 1; index <= 6; index += 1) {
      const value = logoValue(`f${index}0`);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `logo-slot${selectedLogoSlot === index ? ' is-active' : ''}`;
      button.setAttribute('aria-pressed', String(selectedLogoSlot === index));
      button.innerHTML = `<span class="logo-slot-image">${logoPreview(value)}</span><span><strong>${escapeHTML(logoTitle(index))}</strong><small>${value ? `${logoGroups(logoValue(`f${index}5`)).join('、') || '无'} 组` : '未选图片'}</small></span>`;
      button.addEventListener('click', () => {
        selectedLogoSlot = index;
        renderLogoSlots();
        renderLogoSlotEditor();
      });
      container.append(button);
    }
  }

  function renderLogoSlotEditor() {
    const index = selectedLogoSlot;
    const file = logoValue(`f${index}0`);
    const asset = logoAsset(file);
    const container = $('logoSlotEditor');
    container.innerHTML = `<div class="logo-editor-heading"><strong>图片 ${index}</strong><span>${escapeHTML(logoGroups(logoValue(`f${index}5`)).map((group) => `${group} 组`).join(' · ') || '未加入标志组')}</span></div>
      <div class="logo-selected-preview">${logoPreview(file)}<span>${escapeHTML(asset?.name || (file ? '文件未找到' : '未选择图片'))}</span></div>
      <label class="field-label">图片文件<select id="logoFileSelect"></select></label>
      <label class="field-label">显示名称<input id="logoDisplayName" type="text" maxlength="100" placeholder="留空使用文件名"></label>
      <div class="property-grid"><label class="field-label">角标样式<select id="logoStyle"><option value="auto">自动</option><option value="badge">圆形徽章</option><option value="plate">白色横条</option></select></label>
      <label class="field-label">图片大小<select id="logoScale"><option value="0.7">70%</option><option value="0.85">85%</option><option value="1">100%</option><option value="1.1">110%</option><option value="1.2">120%</option></select></label></div>
      <label class="field-label">单张停留（秒）<input id="logoDwell" type="number" min="3" max="3600" step="1" placeholder="使用组默认间隔"></label>`;
    const choices = [['', '不使用图片'], ...logoAssets.map((entry) => [entry.value, entry.name])];
    if (file && !asset) choices.splice(1, 0, [file, `未找到：${file}`]);
    optionList($('logoFileSelect'), choices, file);
    $('logoDisplayName').value = logoValue(`f${index}1`);
    $('logoStyle').value = logoValue(`f${index}2`) || 'auto';
    $('logoScale').value = logoValue(`f${index}3`) || '1';
    $('logoDwell').value = logoValue(`f${index}4`);
    $('logoFileSelect').addEventListener('change', (event) => {
      setLogoValue(`f${index}0`, event.target.value);
      renderLogoSlots();
      renderLogoSlotEditor();
      renderLogoGroupTabs();
      renderLogoGroupPanel();
    });
    $('logoDisplayName').addEventListener('input', (event) => setLogoValue(`f${index}1`, event.target.value));
    $('logoDisplayName').addEventListener('change', () => { renderLogoSlots(); renderLogoGroupPanel(); });
    $('logoStyle').addEventListener('change', (event) => setLogoValue(`f${index}2`, event.target.value));
    $('logoScale').addEventListener('change', (event) => setLogoValue(`f${index}3`, event.target.value));
    $('logoDwell').addEventListener('change', (event) => setLogoValue(`f${index}4`, event.target.value));
  }

  function renderLogoMappings() {
    const source = sourceById(logoDraft.sourceId);
    optionList($('logoGroupSource'), [['', '手动设置'], ...state.sources.sources
      .filter((entry) => !entry.archived || entry.id === logoDraft.sourceId)
      .map((entry) => [entry.id, entry.name])], logoDraft.sourceId);
    $('logoSourceRowLabel').hidden = !source;
    optionList($('logoGroupRow'), (source?.rows || []).map((row, index) => [String(index),
      `第 ${index + 1} 行 · ${Object.values(row).filter((value) => value && typeof value === 'string').slice(1, 3).join(' / ').slice(0, 35)}`]), String(logoDraft.rowIndex));
    const container = $('logoGroupMappings');
    container.replaceChildren();
    if (!source) return;
    for (const [index, field] of logoGroupFields.entries()) {
      const label = document.createElement('label');
      label.className = 'field-label logo-mapping-row';
      label.textContent = `${index ? logoTitle(index) : '学校标志'}所属组`;
      const select = document.createElement('select');
      optionList(select, [['', '手动勾选'], ...source.columns.map((column) => [column.key, column.title])],
        logoDraft.fieldColumns[field] || '');
      select.addEventListener('change', () => {
        logoDraft.fieldColumns[field] = select.value;
        markLogoDirty();
        renderLogoGroupTabs();
        renderLogoGroupPanel();
        renderLogoSlots();
        renderLogoSlotEditor();
      });
      label.append(select);
      container.append(label);
    }
  }

  function renderLogoEditor() {
    if (!logoDraft) return;
    renderLogoGroupTabs();
    renderLogoGroupPanel();
    renderLogoSlots();
    renderLogoSlotEditor();
    renderLogoMappings();
  }

  async function loadLogoAssets() {
    const result = await api('/logos');
    logoAssets = result.logos;
    if (logoDraft) renderLogoEditor();
  }

  function renderInspector() {
    const item = itemById(selectedItemId);
    if (!item) {
      selectedItemId = null;
      $('inspectorEmpty').hidden = false;
      $('inspectorBody').hidden = true;
      return;
    }
    $('inspectorEmpty').hidden = true;
    $('inspectorBody').hidden = false;
    $('inspectorType').textContent = item.relpath?.split('/').pop() || '包装';
    $('inspectorTitle').textContent = cardName(item);
    $('inspectorLayer').textContent = `${state.bindings.items[item.itemID]?.outputLayer || item.webplayout || '-'} 层`;
    bindingDraft = structuredClone(state.bindings.items[item.itemID] || defaultBinding(item));
    bindingDirty = false;
    rangeAnchor = null;
    $('bindingStatus').textContent = '已保存';
    const logo = isLogoLibrary(item);
    $('genericSourceSection').hidden = logo;
    $('genericFieldsSection').hidden = logo;
    $('bugItemEditor').hidden = !logo;
    if (logo) {
      if (fieldTable) { fieldTable.destroy(); fieldTable = null; }
      if (itemSourceTable) { itemSourceTable.destroy(); itemSourceTable = null; }
      prepareBugDraft(item);
    }
    const activeSources = state.sources.sources.filter((source) => !source.archived || source.id === bindingDraft.sourceId);
    optionList($('itemSource'), [['', '手动输入'], ...activeSources.map((source) => [source.id, source.name])], bindingDraft.sourceId);
    $('itemMode').value = bindingDraft.mode;
    $('itemRow').value = bindingDraft.rowIndex + 1;
    $('rangeStart').value = bindingDraft.rangeStart;
    $('rangeEnd').value = bindingDraft.rangeEnd;
    $('outputLayer').value = bindingDraft.outputLayer;
    $('itemOut').value = /^\d+$/.test(bindingDraft.out) ? 'timer' : bindingDraft.out;
    $('timeoutSeconds').value = /^\d+$/.test(bindingDraft.out) ? Math.max(1, Math.round(Number(bindingDraft.out) / 1000)) : 5;
    $('timeoutField').hidden = $('itemOut').value !== 'timer';
    if (logo) {
      const values = effective(item, bindingDraft);
      $('bugStatus').value = values.f0 || 'live';
      $('bugFollow').value = values.f6 || '1';
      $('bugEvent').value = values.f1 || '';
      $('bugClock').checked = values.f2 === '1';
      $('bugName').checked = values.f3 === '1';
    } else {
      renderSourceControls(item);
      renderFieldTable(item);
    }
    renderCards();
  }

  function renderSourceControls(item) {
    const source = sourceById(bindingDraft.sourceId);
    const fields = editableFields(item).filter((field) => field.ftype === 'textarea');
    $('sourceModeGroup').hidden = !source;
    $('singleRowField').hidden = bindingDraft.mode === 'range';
    $('rangeOptions').hidden = !source || bindingDraft.mode !== 'range';
    $('seedSource').hidden = Boolean(source);
    $('itemMode').querySelector('[value="range"]').disabled = !fields.length;
    if (!fields.length && bindingDraft.mode === 'range') bindingDraft.mode = $('itemMode').value = 'row';
    const columns = source?.columns || [];
    optionList($('rangeField'), fields.map((field) => [field.field, field.title || field.field]), bindingDraft.rangeField);
    optionList($('rangeTextColumn'), [['', '选择内容列'], ...columns.map((column) => [column.key, column.title])], bindingDraft.rangeTextColumn);
    optionList($('rangeTimeColumn'), [['', '无'], ...columns.map((column) => [column.key, column.title])], bindingDraft.rangeTimeColumn);
    $('itemRow').max = source?.rows.length || 1;
    $('rangeStart').max = source?.rows.length || 1;
    $('rangeEnd').max = source?.rows.length || 1;
    renderItemSourceTable();
  }

  async function selectItem(itemId) {
    try {
      if (bindingDirty && selectedItemId !== itemId) await saveBinding();
      selectedItemId = itemId;
      renderInspector();
      if (window.matchMedia('(max-width: 740px)').matches) $('inspector').classList.add('is-open');
    } catch (error) { toast(error.message, true); }
  }

  async function saveBinding() {
    if (!selectedItemId || !bindingDraft) return;
    captureFields();
    updateDraftControls();
    $('saveBinding').disabled = true;
    try {
      const result = await api(`/items/${encodeURIComponent(selectedItemId)}`, 'PUT', {
        revision: state.bindings.revision, binding: bindingDraft
      });
      state.bindings = result;
      bindingDirty = false;
      $('bindingStatus').textContent = '已保存';
      renderCards();
      toast('包装配置已保存');
    } finally { $('saveBinding').disabled = false; }
  }

  async function saveLogoLibrary() {
    if (!logoDraft) return;
    if (sourceDirty) await saveSource();
    $('saveLogoLibrary').disabled = true;
    try {
      const result = await api('/logo-library', 'PUT', {
        revision: state.logoLibrary.revision, library: logoDraft
      });
      state.logoLibrary = result;
      logoDraft = structuredClone(result);
      logoDirty = false;
      $('logoLibraryStatus').textContent = '已保存';
      renderCards();
      const liveBug = state.items.find((item) => isLogoLibrary(item) && item.onair === 'true');
      if (liveBug) {
        try {
          await api(`/items/${encodeURIComponent(liveBug.itemID)}/action`, 'POST', { action: 'update' });
          toast('项目标志组已保存并更新播出');
        } catch (error) { toast(`已保存，但播出更新失败：${error.message}`, true); }
      } else toast('项目标志组已保存');
    } finally { $('saveLogoLibrary').disabled = false; }
  }

  async function seedSourceFromItem() {
    const item = itemById(selectedItemId);
    if (!item) return;
    captureFields();
    const values = effective(item, bindingDraft);
    const listField = editableFields(item).find((field) => field.ftype === 'textarea' && values[field.field]?.includes('\n'));
    let columns;
    let rows;
    if (listField) {
      const lines = values[listField.field].split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
      const hasTime = lines.some((line) => line.includes('|'));
      columns = hasTime
        ? [{ key: 'time', title: '时间' }, { key: 'content', title: '内容' }]
        : [{ key: 'content', title: '内容' }];
      rows = lines.map((line) => {
        const separator = line.indexOf('|');
        return hasTime && separator >= 0
          ? { time: line.slice(0, separator).trim(), content: line.slice(separator + 1).trim() }
          : { time: '', content: line };
      });
    } else {
      const fields = editableFields(item).slice(0, 30);
      columns = fields.map((field, index) => ({ key: `c${index + 1}`, title: field.title || field.field }));
      rows = [Object.fromEntries(fields.map((field, index) => [`c${index + 1}`, values[field.field] || '']))];
    }
    try {
      if (sourceDirty) await saveSource();
      const result = await api('/sources', 'POST', {
        revision: state.sources.revision,
        source: { name: cardName(item), columns, rows }
      });
      state.sources = result;
      const source = result.sources[result.sources.length - 1];
      selectedSourceId = source.id;
      bindingDraft.sourceId = source.id;
      if (listField) {
        bindingDraft.mode = 'range';
        bindingDraft.rangeField = listField.field;
        bindingDraft.rangeStart = 1;
        bindingDraft.rangeEnd = rows.length || 1;
        bindingDraft.rangeTimeColumn = columns.some((column) => column.key === 'time') ? 'time' : '';
        bindingDraft.rangeTextColumn = 'content';
      } else {
        editableFields(item).slice(0, 30).forEach((field, index) => {
          bindingDraft.fieldColumns[field.field] = `c${index + 1}`;
        });
      }
      markBindingDirty();
      renderSourceList();
      renderInspectorWithDraft(item);
      toast('已创建数据源，保存包装配置即可关联');
    } catch (error) { toast(error.message, true); }
  }

  function renderInspectorWithDraft(item) {
    const draft = bindingDraft;
    renderInspector();
    bindingDraft = draft;
    $('itemSource').value = draft.sourceId;
    $('itemMode').value = draft.mode;
    $('rangeStart').value = draft.rangeStart;
    $('rangeEnd').value = draft.rangeEnd;
    renderSourceControls(item);
    renderFieldTable(item);
    markBindingDirty();
  }

  function markSourceDirty() {
    sourceDirty = true;
    $('sourceStatus').textContent = '未保存';
  }

  function renderSourceList() {
    if (!state) return;
    const container = $('sourceList');
    container.replaceChildren();
    for (const source of state.sources.sources) {
      if (source.archived && !$('showArchived').checked) continue;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `${source.id === selectedSourceId ? 'is-active ' : ''}${source.archived ? 'is-archived' : ''}`;
      const label = document.createElement('span');
      label.textContent = source.name;
      const count = document.createElement('small');
      count.textContent = `${source.rows.length} 行`;
      button.append(label, count);
      button.addEventListener('click', () => selectSource(source.id));
      container.append(button);
    }
  }

  function captureSource() {
    if (!sourceDraft || !sourceTable) return;
    sourceDraft.name = $('sourceName').value.trim();
    sourceDraft.rows = sourceTable.getData().map((row) => ({ ...row }));
  }

  function renderSourceEditor() {
    const source = sourceById(selectedSourceId);
    if (!source) {
      selectedSourceId = null;
      $('sourceEmpty').hidden = false;
      $('sourceBody').hidden = true;
      return;
    }
    $('sourceEmpty').hidden = true;
    $('sourceBody').hidden = false;
    sourceDraft = structuredClone(source);
    sourceDirty = false;
    $('sourceName').value = source.name;
    $('sourceMeta').textContent = source.archived ? '已归档' : `${source.columns.length} 列`;
    $('sourceStatus').textContent = '已保存';
    $('sourceCount').textContent = `${source.rows.length} 行`;
    $('archiveSource').title = source.archived ? '恢复数据源' : '归档数据源';
    $('archiveSource').setAttribute('aria-label', $('archiveSource').title);
    if (sourceTable) { sourceTable.destroy(); sourceTable = null; }
    sourceTable = new Tabulator('#sourceTable', {
      data: sourceDraft.rows,
      index: '_id',
      height: '100%',
      layout: 'fitDataStretch',
      editTriggerEvent: 'click',
      selectableRows: true,
      clipboard: true,
      clipboardCopyStyled: false,
      clipboardCopyConfig: { rowHeaders: false, columnHeaders: false },
      clipboardCopyRowRange: 'selected',
      clipboardPasteAction: function (rows) {
        markSourceDirty();
        return this.table.addData(rows.map((row) => ({ ...row, _id: crypto.randomUUID() })));
      },
      rowHeader: { formatter: 'rowSelection', titleFormatter: 'rowSelection', width: 40,
        minWidth: 40, maxWidth: 40, resizable: false, editor: false, headerSort: false },
      columnDefaults: { headerSort: false, editor: 'input', resizable: 'header', minWidth: 120, formatter: 'plaintext' },
      columns: sourceDraft.columns.map((column) => ({
        title: escapeHTML(column.title), field: column.key, width: 175,
        headerMenu: [{ label: '重命名列', action: (event, component) => {
          renameColumn(component).catch((error) => toast(error.message, true));
        } }]
      }))
    });
    sourceTable.on('cellEdited', markSourceDirty);
    sourceTable.on('dataChanged', () => {
      if (sourceTable) $('sourceCount').textContent = `${sourceTable.getData().length} 行`;
    });
  }

  async function selectSource(sourceId) {
    try {
      if (sourceDirty && selectedSourceId !== sourceId) await saveSource();
      selectedSourceId = sourceId;
      renderSourceList();
      renderSourceEditor();
    } catch (error) { toast(error.message, true); }
  }

  async function saveSource() {
    if (!sourceDraft) return;
    captureSource();
    $('saveSource').disabled = true;
    try {
      const result = await api(`/sources/${encodeURIComponent(sourceDraft.id)}`, 'PUT', {
        revision: state.sources.revision,
        source: sourceDraft
      });
      state.sources = result;
      sourceDirty = false;
      $('sourceStatus').textContent = '已保存';
      renderSourceList();
      renderCards();
      toast('数据源已保存');
    } finally { $('saveSource').disabled = false; }
  }

  function askName(title, label, initial = '') {
    return new Promise((resolve) => {
      const dialog = $('nameDialog');
      $('dialogTitle').textContent = title;
      $('dialogLabel').firstChild.textContent = label;
      $('dialogInput').value = initial;
      dialog.addEventListener('close', () => {
        resolve(dialog.returnValue === 'confirm' ? $('dialogInput').value.trim() : '');
      }, { once: true });
      dialog.showModal();
      $('dialogInput').focus();
    });
  }

  async function newSource() {
    const name = await askName('新建数据源', '名称');
    if (!name) return;
    try {
      if (sourceDirty) await saveSource();
      const result = await api('/sources', 'POST', {
        revision: state.sources.revision,
        source: { name, columns: [{ key: 'content', title: '内容' }], rows: [] }
      });
      state.sources = result;
      selectedSourceId = result.sources[result.sources.length - 1].id;
      $('tabSources').click();
      renderSourceList();
      renderSourceEditor();
      toast('数据源已创建');
    } catch (error) { toast(error.message, true); }
  }

  async function addColumn() {
    if (!sourceDraft) return;
    const title = await askName('添加列', '列名');
    if (!title) return;
    captureSource();
    let number = 1;
    while (sourceDraft.columns.some((column) => column.key === `c${number}`)) number += 1;
    const key = `c${number}`;
    sourceDraft.columns.push({ key, title });
    sourceDraft.rows.forEach((row) => { row[key] = ''; });
    await sourceTable.addColumn({ title: escapeHTML(title), field: key, width: 175,
      headerSort: false, editor: 'input', formatter: 'plaintext',
      headerMenu: [{ label: '重命名列', action: (event, component) => {
        renameColumn(component).catch((error) => toast(error.message, true));
      } }] });
    await sourceTable.setData(sourceDraft.rows);
    markSourceDirty();
    $('sourceMeta').textContent = `${sourceDraft.columns.length} 列`;
  }

  async function renameColumn(component) {
    const column = sourceDraft?.columns.find((entry) => entry.key === component.getField());
    if (!column) return;
    const title = await askName('重命名列', '列名', column.title);
    if (!title || title === column.title) return;
    captureSource();
    column.title = title;
    await component.updateDefinition({ title: escapeHTML(title) });
    markSourceDirty();
  }

  async function duplicateSource() {
    if (!sourceDraft) return;
    try {
      if (sourceDirty) await saveSource();
      const source = sourceById(selectedSourceId);
      const result = await api('/sources', 'POST', {
        revision: state.sources.revision,
        source: { ...source, name: `${source.name} 副本`, rows: source.rows.map((row) => ({ ...row, _id: crypto.randomUUID() })) }
      });
      state.sources = result;
      selectedSourceId = result.sources[result.sources.length - 1].id;
      renderSourceList();
      renderSourceEditor();
      toast('数据源已复制');
    } catch (error) { toast(error.message, true); }
  }

  async function archiveSource() {
    const source = sourceById(selectedSourceId);
    if (!source) return;
    if (!source.archived && !window.confirm(`归档“${source.name}”？已有包装仍可读取，但新配置中不再显示。`)) return;
    try {
      if (sourceDirty) await saveSource();
      state.sources = await api(`/sources/${encodeURIComponent(source.id)}/archive`, 'POST', {
        archived: !source.archived, revision: state.sources.revision
      });
      renderSourceList();
      renderSourceEditor();
      toast(source.archived ? '数据源已恢复' : '数据源已归档');
    } catch (error) { toast(error.message, true); }
  }

  async function importCsv(file) {
    if (!file) return;
    if (file.size > 2_000_000) { toast('CSV 不能超过 2 MB', true); return; }
    Papa.parse(file, {
      header: true,
      skipEmptyLines: 'greedy',
      complete: async (result) => {
        const headers = result.meta.fields || [];
        if (result.errors.length || !headers.length || headers.length > 30 || result.data.length > 5000) {
          toast('CSV 解析失败，或超过 30 列 / 5000 行', true);
          return;
        }
        const columns = headers.map((title, index) => ({ key: `c${index + 1}`, title: title.trim() || `列 ${index + 1}` }));
        const rows = result.data.map((entry) => Object.fromEntries(headers.map((title, index) => [
          `c${index + 1}`, String(entry[title] ?? '')
        ])));
        try {
          if (sourceDirty) await saveSource();
          const saved = await api('/sources', 'POST', {
            revision: state.sources.revision,
            source: { name: file.name.replace(/\.csv$/i, ''), columns, rows }
          });
          state.sources = saved;
          selectedSourceId = saved.sources[saved.sources.length - 1].id;
          $('tabSources').click();
          renderSourceList();
          renderSourceEditor();
          toast(`已导入 ${rows.length} 行`);
        } catch (error) { toast(error.message, true); }
      }
    });
  }

  function exportCsv() {
    if (!sourceDraft) return;
    captureSource();
    const columns = sourceDraft.columns;
    const csv = Papa.unparse({
      fields: columns.map((column) => column.title),
      data: sourceDraft.rows.map((row) => columns.map((column) => row[column.key] ?? ''))
    }, { escapeFormulae: true });
    const link = document.createElement('a');
    const url = URL.createObjectURL(new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8' }));
    link.href = url;
    link.download = `${sourceDraft.name.replace(/[^\w\u4e00-\u9fa5-]/g, '_') || 'datasource'}.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function switchView(view) {
    const changed = activeView !== view;
    activeView = view;
    const playout = view === 'playout';
    const logos = view === 'logos';
    const sources = view === 'sources';
    $('playoutView').hidden = !playout;
    $('logosView').hidden = !logos;
    $('sourcesView').hidden = !sources;
    $('tabPlayout').classList.toggle('is-active', playout);
    $('tabLogos').classList.toggle('is-active', logos);
    $('tabSources').classList.toggle('is-active', sources);
    $('tabPlayout').setAttribute('aria-selected', String(playout));
    $('tabLogos').setAttribute('aria-selected', String(logos));
    $('tabSources').setAttribute('aria-selected', String(sources));
    if (!playout) $('inspector').classList.remove('is-open');
    if (sources && selectedSourceId && !sourceTable) renderSourceEditor();
    if (changed) requestAnimationFrame(() => {
      if (playout && fieldTable) fieldTable.redraw(true);
      if (sources && sourceTable) sourceTable.redraw(true);
    });
  }

  function addRow() {
    if (!sourceDraft || !sourceTable) return;
    const row = { _id: crypto.randomUUID() };
    sourceDraft.columns.forEach((column) => { row[column.key] = ''; });
    sourceTable.addRow(row, false);
    markSourceDirty();
    $('sourceCount').textContent = `${sourceTable.getData().length} 行`;
  }

  async function removeRows() {
    if (!sourceTable) return;
    const rows = sourceTable.getSelectedRows();
    if (!rows.length) { toast('先勾选要删除的行', true); return; }
    if (!window.confirm(`删除选中的 ${rows.length} 行？保存前可以刷新页面撤销。`)) return;
    await Promise.all(rows.map((row) => row.delete()));
    markSourceDirty();
    $('sourceCount').textContent = `${sourceTable.getData().length} 行`;
  }

  $('tabPlayout').addEventListener('click', () => switchView('playout'));
  $('tabLogos').addEventListener('click', () => switchView('logos'));
  $('tabSources').addEventListener('click', () => switchView('sources'));
  $('closeInspector').addEventListener('click', () => $('inspector').classList.remove('is-open'));
  $('itemSearch').addEventListener('input', renderCards);
  $('layerFilter').addEventListener('change', renderCards);
  $('refreshState').addEventListener('click', () => {
    if (bindingDirty || sourceDirty || logoDirty) { toast('先保存当前修改', true); return; }
    loadState().then(() => toast('已刷新')).catch((error) => toast(error.message, true));
  });
  $('itemSource').addEventListener('change', () => {
    captureFields();
    updateDraftControls();
    bindingDraft.fieldColumns = {};
    bindingDraft.rangeTextColumn = '';
    bindingDraft.rangeTimeColumn = '';
    rangeAnchor = null;
    renderSourceControls(itemById(selectedItemId));
    renderFieldTable(itemById(selectedItemId));
  });
  $('itemMode').addEventListener('change', () => {
    captureFields();
    updateDraftControls();
    renderSourceControls(itemById(selectedItemId));
    renderFieldTable(itemById(selectedItemId));
  });
  ['rangeField', 'rangeTextColumn'].forEach((id) => {
    $(id).addEventListener('change', () => {
      captureFields();
      updateDraftControls();
      renderFieldTable(itemById(selectedItemId));
    });
  });
  ['itemRow', 'rangeStart', 'rangeEnd', 'rangeTimeColumn',
    'outputLayer', 'itemOut', 'timeoutSeconds'].forEach((id) => {
    $(id).addEventListener('change', updateDraftControls);
  });
  $('saveBinding').addEventListener('click', () => saveBinding().catch((error) => toast(error.message, true)));
  [['bugStatus', 'f0'], ['bugFollow', 'f6'], ['bugEvent', 'f1']].forEach(([id, field]) => {
    $(id).addEventListener(id === 'bugEvent' ? 'input' : 'change', (event) => {
      bindingDraft.manualValues[field] = event.target.value;
      markBindingDirty();
    });
  });
  [['bugClock', 'f2'], ['bugName', 'f3']].forEach(([id, field]) => {
    $(id).addEventListener('change', (event) => {
      bindingDraft.manualValues[field] = event.target.checked ? '1' : '0';
      markBindingDirty();
    });
  });
  [['logoGroupMode', () => `f${68 + Number(selectedLogoGroup) * 2}`],
    ['logoGroupInterval', () => `f${69 + Number(selectedLogoGroup) * 2}`],
    ['logoSchoolDwell', 'f5']].forEach(([id, field]) => {
    $(id).addEventListener('change', (event) => {
      setLogoValue(typeof field === 'function' ? field() : field, event.target.value);
      if (id === 'logoGroupMode') $('logoGroupInterval').disabled = event.target.value !== 'auto';
    });
  });
  $('saveLogoLibrary').addEventListener('click', () => saveLogoLibrary().catch((error) => toast(error.message, true)));
  $('logoGroupSource').addEventListener('change', (event) => {
    logoDraft.sourceId = event.target.value;
    logoDraft.rowIndex = 0;
    logoDraft.fieldColumns = {};
    markLogoDirty();
    renderLogoMappings();
    renderLogoGroupTabs();
    renderLogoGroupPanel();
  });
  $('logoGroupRow').addEventListener('change', (event) => {
    logoDraft.rowIndex = Number(event.target.value) || 0;
    markLogoDirty();
    renderLogoGroupTabs();
    renderLogoGroupPanel();
    renderLogoSlots();
    renderLogoSlotEditor();
  });
  $('logoUploadButton').addEventListener('click', () => $('logoUploadInput').click());
  $('logoUploadInput').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    event.target.value = '';
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type) || file.size > 5_000_000) {
      toast('请选择 5 MB 以下的 PNG、JPG、WebP 或 GIF 图片', true);
      return;
    }
    try {
      const response = await fetch(`${endpoint}/logos?name=${encodeURIComponent(file.name)}`, {
        method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': file.type }, body: file
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || `上传失败 (${response.status})`);
      logoAssets.push(result);
      setLogoValue(`f${selectedLogoSlot}0`, result.value);
      renderLogoEditor();
      toast('图片已上传，保存配置后生效');
    } catch (error) { toast(error.message, true); }
  });
  $('seedSource').addEventListener('click', seedSourceFromItem);
  $('showArchived').addEventListener('change', renderSourceList);
  $('newSource').addEventListener('click', newSource);
  $('sourceName').addEventListener('input', markSourceDirty);
  $('addRow').addEventListener('click', addRow);
  $('addColumn').addEventListener('click', () => addColumn().catch((error) => toast(error.message, true)));
  $('removeRows').addEventListener('click', () => removeRows().catch((error) => toast(error.message, true)));
  $('duplicateSource').addEventListener('click', duplicateSource);
  $('archiveSource').addEventListener('click', archiveSource);
  $('importCsv').addEventListener('click', () => $('csvInput').click());
  $('csvInput').addEventListener('change', (event) => {
    importCsv(event.target.files[0]);
    event.target.value = '';
  });
  $('exportCsv').addEventListener('click', exportCsv);
  $('saveSource').addEventListener('click', () => saveSource().catch((error) => toast(error.message, true)));
  window.addEventListener('beforeunload', (event) => {
    if (bindingDirty || sourceDirty || logoDirty) { event.preventDefault(); event.returnValue = ''; }
  });

  const socket = io();
  const connectionLabel = $('connectionStatus');
  socket.on('connect', () => {
    connectionLabel.classList.add('is-online');
    connectionLabel.lastElementChild.textContent = '播出连接正常';
  });
  socket.on('disconnect', () => {
    connectionLabel.classList.remove('is-online');
    connectionLabel.lastElementChild.textContent = '连接中断';
  });

  fetch('/auth/me', { credentials: 'same-origin' }).then(async (response) => {
    if (!response.ok) return;
    const session = await response.json();
    $('sessionUser').textContent = session.user;
    $('sessionUser').hidden = false;
    $('logoutForm').hidden = false;
  }).catch(() => {});

  loadState(false).then(() => {
    if (logoDraft) loadLogoAssets().catch((error) => toast(error.message, true));
    selectedItemId = state.items[0]?.itemID || null;
    renderInspector();
    selectedSourceId = state.sources.sources.find((source) => !source.archived)?.id || null;
    renderSourceEditor();
    switchView('playout');
  }).catch((error) => toast(error.message, true));

  setInterval(() => {
    if (['playout', 'logos'].includes(activeView) && !bindingDirty && !sourceDirty && !logoDirty && !document.hidden) {
      loadState().catch(() => {});
    }
  }, 15000);
})();
