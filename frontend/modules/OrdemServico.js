export default class OrdemServico {
  constructor(formClass) {
    this.form = document.querySelector(formClass);
  }

  init() {
    if (!this.form) return;
    this.index = this.form.querySelectorAll('#corpo-itens tr').length;
    this.events();
    this.calcTotalGeral();
  }

  events() {
    const btnAdd = this.form.querySelector('#btn-add-item');
    const corpoItens = this.form.querySelector('#corpo-itens');
    const inputFiltro = this.form.querySelector('#filtro-produto');

    if (inputFiltro) {
      inputFiltro.addEventListener('input', e => this.filtrarPeças(e.target.value));
    }

    if (btnAdd) {
      btnAdd.addEventListener('click', () => this.addItem());
    }

    this.form.addEventListener('input', e => {
      if (e.target.id === 'mao_obra' || 
          e.target.classList.contains('input-qtd') || 
          e.target.classList.contains('input-valor')) {
        this.calcTotalGeral();
      }
    });

    // CORREÇÃO AQUI: Delegação de evento melhorada
    corpoItens.addEventListener('click', e => {
      // Verifica se clicou no botão ou no ícone dentro dele
      const btnDelete = e.target.closest('.btn-remover');
      if (btnDelete) {
        btnDelete.closest('tr').remove();
        this.calcTotalGeral();
      }
    });
  }

  filtrarPeças(termo) {
    const select = this.form.querySelector('#sel-prod');
    const options = select.querySelectorAll('option');
    const busca = termo.toLowerCase();

    options.forEach(opt => {
      if (opt.value === "") return;
      const textoBusca = opt.getAttribute('data-search') || "";
      opt.style.display = textoBusca.includes(busca) ? 'block' : 'none';
    });

    if (select.options[select.selectedIndex]?.style.display === 'none') {
      select.value = "";
    }
  }

  addItem() {
    const select = this.form.querySelector('#sel-prod');
    const inputQtd = this.form.querySelector('#sel-qtd');
    const corpoItens = this.form.querySelector('#corpo-itens');

    // Pega a opção que está selecionada no momento
    const selectedOption = select.options[select.selectedIndex];
    
    const descricao = select.value;
    const valorUnitario = parseFloat(selectedOption?.dataset.valor) || 0;
    
    // 🔥 AQUI ESTÁ O SEGREDO: 
    // No EJS você colocou data-tipo="<%= p.tipo %>", então aqui usamos dataset.tipo
    const tipo = selectedOption?.dataset.tipo || 'Peça'; 

    const quantidade = parseInt(inputQtd.value) || 0;

    if (!descricao || quantidade <= 0) return;

    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td>
          <input type="hidden" name="itens[${this.index}][descricao]" value="${descricao}">
          <input type="hidden" name="itens[${this.index}][tipo]" value="${tipo}" class="input-tipo">
          ${descricao} <small class="badge bg-light text-dark border">${tipo}</small>
        </td>
        <td>
          <input type="number" name="itens[${this.index}][quantidade]" class="form-control form-control-sm input-qtd" value="${quantidade}">
        </td>
        <td>
          <div class="input-group input-group-sm">
            <span class="input-group-text">R$</span>
            <input type="number" step="0.01" name="itens[${this.index}][valorUnitario]" class="form-control input-valor" value="${valorUnitario.toFixed(2)}">
          </div>
        </td>
        <td class="subtotal-item fw-bold">R$ ${(valorUnitario * quantidade).toFixed(2)}</td>
        <td>
          <button type="button" class="btn btn-sm btn-outline-danger btn-remover border-0">
            <i class="bi bi-trash"></i>
          </button>
        </td>
    `;

    corpoItens.appendChild(tr);
    this.index++;
    this.calcTotalGeral();
    
    // Limpa campos
    select.value = '';
    inputQtd.value = 1;
}

  calcTotalGeral() {
    const inputMaoObra = this.form.querySelector('#mao_obra');
    const displayTotalGeral = this.form.querySelector('#total_exibido');
    const displayTotalPecas = this.form.querySelector('#total_pecas'); 
    
    let totalPecas = 0;
    let totalServicosTabela = 0;
    let maoDeObraFixa = parseFloat(inputMaoObra?.value) || 0;

    const linhas = this.form.querySelectorAll('#corpo-itens tr');

    linhas.forEach(linha => {
        const qtd = parseFloat(linha.querySelector('.input-qtd').value) || 0;
        const valorUn = parseFloat(linha.querySelector('.input-valor').value) || 0;
        const tipo = linha.querySelector('.input-tipo')?.value || 'Peça';
        const subtotal = qtd * valorUn;

        const subtotalDisplay = linha.querySelector('.subtotal-item');
        if (subtotalDisplay) subtotalDisplay.innerText = `R$ ${subtotal.toFixed(2)}`;
        
        if (tipo === 'Serviço') {
            totalServicosTabela += subtotal;
        } else {
            totalPecas += subtotal;
        }
    });

    if (displayTotalPecas) displayTotalPecas.innerText = totalPecas.toFixed(2);
    
    if (displayTotalGeral) {
        const totalGeral = totalPecas + totalServicosTabela + maoDeObraFixa;
        displayTotalGeral.innerText = totalGeral.toFixed(2);
    }
  }
}