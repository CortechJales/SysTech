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
    const inputMaoObra = this.form.querySelector('#mao_obra');
    const corpoItens = this.form.querySelector('#corpo-itens');
    const inputFiltro = this.form.querySelector('#filtro-produto');

    // Lógica do Filtro
    if (inputFiltro) {
      inputFiltro.addEventListener('input', e => this.filtrarPeças(e.target.value));
    }

    // Adicionar Item
    if (btnAdd) {
      btnAdd.addEventListener('click', () => this.addItem());
    }

    // Monitorar Mudanças (Mão de Obra, Qtd ou Preço manual)
    this.form.addEventListener('input', e => {
      if (e.target.id === 'mao_obra' || 
          e.target.classList.contains('input-qtd') || 
          e.target.classList.contains('input-valor')) {
        this.calcTotalGeral();
      }
    });

    // Remover Item
    corpoItens.addEventListener('click', e => {
      if (e.target.classList.contains('btn-remover')) {
        e.target.closest('tr').remove();
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
      const textoBusca = opt.getAttribute('data-search');
      // Exibe se encontrar o código ou a descrição
      opt.style.display = textoBusca.includes(busca) ? 'block' : 'none';
    });

    // Reseta o select para a primeira opção válida se a atual sumir
    if (select.options[select.selectedIndex].style.display === 'none') {
      select.value = "";
    }
  }

  addItem() {
    const select = this.form.querySelector('#sel-prod');
    const inputQtd = this.form.querySelector('#sel-qtd');
    const corpoItens = this.form.querySelector('#corpo-itens');

    const descricao = select.value;
    const valorUnitario = select.options[select.selectedIndex]?.dataset.valor;
    const quantidade = inputQtd.value;

    if (!descricao || !quantidade || quantidade <= 0) return;

    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><input type="hidden" name="itens[${this.index}][descricao]" value="${descricao}">${descricao}</td>
        <td><input type="number" name="itens[${this.index}][quantidade]" class="form-control form-control-sm input-qtd" value="${quantidade}"></td>
        <td><input type="number" step="0.01" name="itens[${this.index}][valorUnitario]" class="form-control form-control-sm input-valor" value="${valorUnitario}"></td>
        <td class="subtotal-item fw-bold">R$ ${(valorUnitario * quantidade).toFixed(2)}</td>
        <td><button type="button" class="btn btn-sm text-danger btn-remover">X</button></td>
    `;

    corpoItens.appendChild(tr);
    this.index++;
    this.calcTotalGeral();
    
    // Limpa o filtro após adicionar
    const inputFiltro = this.form.querySelector('#filtro-produto');
    inputFiltro.value = '';
    this.filtrarPeças('');
  }

  calcTotalGeral() {
    const inputMaoObra = this.form.querySelector('#mao_obra');
    const displayTotalGeral = this.form.querySelector('#total_exibido');
    const displayTotalPecas = this.form.querySelector('#total_pecas'); // Novo campo
    
    let totalPecas = 0;
    let maoDeObra = parseFloat(inputMaoObra?.value) || 0;

    const linhas = this.form.querySelectorAll('#corpo-itens tr');

    linhas.forEach(linha => {
        const qtd = parseFloat(linha.querySelector('.input-qtd').value) || 0;
        const valorUn = parseFloat(linha.querySelector('.input-valor').value) || 0;
        const subtotal = qtd * valorUn;

        linha.querySelector('.subtotal-item').innerText = `R$ ${subtotal.toFixed(2)}`;
        totalPecas += subtotal; // Soma apenas os produtos
    });

    // Atualiza o total das peças na tabela
    if (displayTotalPecas) displayTotalPecas.innerText = totalPecas.toFixed(2);
    
    // Atualiza o total geral (Peças + Mão de Obra)
    if (displayTotalGeral) {
        const totalGeral = totalPecas + maoDeObra;
        displayTotalGeral.innerText = totalGeral.toFixed(2);
    }
}
}