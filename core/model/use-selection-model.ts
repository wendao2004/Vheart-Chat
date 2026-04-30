import { ref, computed } from 'vue';

/**
 * 选择模式模型
 * 用于管理消息选择相关的逻辑
 */
export function useSelectionModel() {
	// 选择模式状态
	const selectionMode = ref(false);
	// 选中的消息列表（存储消息ID）
	const selectedMessages = ref<string[]>([]);

	/**
	 * 进入选择模式
	 * @param initialMessageId 初始选中的消息ID
	 */
	const enterSelectionMode = (initialMessageId?: string) => {
		selectionMode.value = true;
		if (initialMessageId) {
			selectedMessages.value = [initialMessageId];
		} else {
			selectedMessages.value = [];
		}
	};

	/**
	 * 退出选择模式
	 */
	const exitSelectionMode = () => {
		selectionMode.value = false;
		selectedMessages.value = [];
	};

	/**
	 * 切换消息选择状态
	 * @param messageId 消息ID
	 */
	const toggleMessageSelection = (messageId: string) => {
		const index = selectedMessages.value.indexOf(messageId);
		if (index > -1) {
			// 取消选择
			selectedMessages.value.splice(index, 1);
		} else {
			// 添加选择
			selectedMessages.value.push(messageId);
		}
	};

	/**
	 * 检查消息是否被选中
	 * @param messageId 消息ID
	 * @returns 是否被选中
	 */
	const isMessageSelected = (messageId: string) => {
		return selectedMessages.value.includes(messageId);
	};

	/**
	 * 获取选中的消息数量
	 */
	const selectedCount = computed(() => {
		return selectedMessages.value.length;
	});

	/**
	 * 清除所有选择
	 */
	const clearSelection = () => {
		selectedMessages.value = [];
	};

	return {
		selectionMode,
		selectedMessages,
		selectedCount,
		enterSelectionMode,
		exitSelectionMode,
		toggleMessageSelection,
		isMessageSelected,
		clearSelection
	};
}
