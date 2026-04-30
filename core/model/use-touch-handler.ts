import { ref } from 'vue';

/**
 * 触摸事件处理器
 * 用于处理长按检测和滑动检测
 */
export function useTouchHandler() {
	// 触摸开始位置
	const touchStartPos = ref({ x: 0, y: 0 });
	// 长按计时器
	const longPressTimer = ref<number | null>(null);
	// 长按触发时间（毫秒）
	const LONG_PRESS_DURATION = 600;
	// 滑动阈值（像素）
	const SWIPE_THRESHOLD = 8;

	/**
	 * 处理触摸开始事件
	 * @param event 触摸事件对象
	 * @param callback 长按回调函数
	 */
	const handleTouchStart = (event: TouchEvent, callback: () => void) => {
		// 记录触摸开始位置
		touchStartPos.value = {
			x: event.touches[0].clientX,
			y: event.touches[0].clientY
		};
		
		// 清除之前的计时器
		if (longPressTimer.value) {
			clearTimeout(longPressTimer.value);
		}
		
		// 启动长按计时器
		longPressTimer.value = setTimeout(() => {
			// 触发长按回调
			callback();
		}, LONG_PRESS_DURATION);
	};

	/**
	 * 处理触摸移动事件
	 * @param event 触摸事件对象
	 */
	const handleTouchMove = (event: TouchEvent) => {
		// 计算移动距离
		const touchCurrentPos = {
			x: event.touches[0].clientX,
			y: event.touches[0].clientY
		};
		const deltaX = Math.abs(touchCurrentPos.x - touchStartPos.value.x);
		const deltaY = Math.abs(touchCurrentPos.y - touchStartPos.value.y);
		
		// 如果移动距离超过阈值，取消长按计时器
		if (deltaX > SWIPE_THRESHOLD || deltaY > SWIPE_THRESHOLD) {
			if (longPressTimer.value) {
				clearTimeout(longPressTimer.value);
				longPressTimer.value = null;
			}
		}
	};

	/**
	 * 处理触摸结束事件
	 */
	const handleTouchEnd = () => {
		// 清除计时器
		if (longPressTimer.value) {
			clearTimeout(longPressTimer.value);
			longPressTimer.value = null;
		}
	};

	return {
		handleTouchStart,
		handleTouchMove,
		handleTouchEnd
	};
}
