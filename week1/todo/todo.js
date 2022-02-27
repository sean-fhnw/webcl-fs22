// requires ../observable/observable.js
// requires ../observable/computed.js
// requires ./fortuneService.js
// requires ../dataflow/dataflow.js

const TodoController = () => {

    const Todo = () => {                                // facade
        const textAttr = Observable("text");            // we current don't expose it as we don't use it elsewhere
        const doneAttr = Observable(false);
        const valid = Computed((text, minLength, minLengthMode) => {
            const length = minLengthMode === 'words' ?
                text.split(/\s+/).length :
                text.length;
            return length >= minLength;
        }, textAttr, minLength, minLengthMode);
        return {
            getDone:       doneAttr.getValue,
            setDone:       doneAttr.setValue,
            onDoneChanged: doneAttr.onChange,
            setText:       textAttr.setValue,
            getText:       textAttr.getValue,
            onTextChanged: textAttr.onChange,
            getValid:      valid.getValue,
            onValidChanged:valid.onChange,
        }
    };

    const todoModel = ObservableList([]); // observable array of Todos, this state is private
    const scheduler = Scheduler();
    const minLength = Observable(1);
    const minLengthMode = Observable('letters');

    const addTodo = () => {
        const newTodo = Todo();
        todoModel.add(newTodo);
        return newTodo;
    };

    const addFortuneTodo = () => {

        const newTodo = Todo();

        todoModel.add(newTodo);
        newTodo.setText('...');

        scheduler.add( ok =>
           fortuneService( text => {        // schedule the fortune service and proceed when done
                   newTodo.setText(text);
                   ok();
               }
           )
        );
    };

    return {
        numberOfTodos:      todoModel.count,
        numberOfopenTasks:  () => todoModel.countIf( todo => ! todo.getDone() ),
        addTodo:            addTodo,
        addFortuneTodo:     addFortuneTodo,
        removeTodo:         todoModel.del,
        onTodoAdd:          todoModel.onAdd,
        onTodoRemove:       todoModel.onDel,
        removeTodoRemoveListener: todoModel.removeDeleteListener, // only for the test case, not used below
        getMinLengthMode:       minLengthMode.getValue,
        setMinLengthMode:       minLengthMode.setValue,
        onMinLengthModeChange:  minLengthMode.onChange,
        getMinLength:           minLength.getValue,
        setMinLength:           minLength.setValue,
        onMinLengthChange:      minLength.onChange,
    }
};


// View-specific parts

const TodoItemsView = (todoController, rootElement) => {

    const render = todo => {

        function createElements() {
            const template = document.createElement('DIV'); // only for parsing
            template.innerHTML = `
                <button class="delete">&times;</button>
                <input type="text" size="42">
                <input type="checkbox">            
            `;
            return template.children;
        }
        const [deleteButton, inputElement, checkboxElement] = createElements();

        checkboxElement.onclick = _ => todo.setDone(checkboxElement.checked);
        deleteButton.onclick    = _ => todoController.removeTodo(todo);
        inputElement.oninput = _ => todo.setText(inputElement.value);

        todoController.onTodoRemove( (removedTodo, removeMe) => {
            if (removedTodo !== todo) return;
            rootElement.removeChild(inputElement);
            rootElement.removeChild(deleteButton);
            rootElement.removeChild(checkboxElement);
            removeMe();
        } );

        todo.onTextChanged(() => inputElement.value = todo.getText());
        todo.onValidChanged(() => inputElement.classList[todo.getValid() ? 'remove' : 'add']('invalid'));

        rootElement.appendChild(deleteButton);
        rootElement.appendChild(inputElement);
        rootElement.appendChild(checkboxElement);
    };

    // binding

    todoController.onTodoAdd(render);

    // we do not expose anything as the view is totally passive.
};

const TodoTotalView = (todoController, numberOfTasksElement) => {

    const render = () =>
        numberOfTasksElement.innerText = "" + todoController.numberOfTodos();

    // binding

    todoController.onTodoAdd(render);
    todoController.onTodoRemove(render);
};

const TodoOpenView = (todoController, numberOfOpenTasksElement) => {

    const render = () =>
        numberOfOpenTasksElement.innerText = "" + todoController.numberOfopenTasks();

    // binding

    todoController.onTodoAdd(todo => {
        render();
        todo.onDoneChanged(render);
    });
    todoController.onTodoRemove(render);
};

const MinTodoLengthView = (todoController, el) => {

    const render = () =>
        el.innerText = todoController.getMinLength() === 1 ?
            `1 ${todoController.getMinLengthMode().slice(0, -1)}` :
            `${todoController.getMinLength()} ${todoController.getMinLengthMode()}`;

    // binding

    todoController.onMinLengthChange(render);
    todoController.onMinLengthModeChange(render);
};


