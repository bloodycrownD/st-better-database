原因说明：
Tailwind 默认的 spacing scale 是基于 0.25rem（即 4px）的倍数，但只包括整数倍，例如：
gap-0 → 0
gap-1 → 0.25rem（4px）
gap-2 → 0.5rem（8px）
gap-3 → 0.75rem（12px）
gap-4 → 1rem（16px）
...
所以 2.5（对应 0.625rem 或 10px）不在默认的 spacing 配置中。
解决方案：
✅ 方法一：使用任意值（Arbitrary Values）（Tailwind v3+ 支持）
你可以直接使用方括号语法来指定任意 gap 值：
html

预览




<div class="grid gap-[10px]">...</div>
<!-- 或 -->
<div class="flex gap-[0.625rem]">...</div>
这是最简单的方式，无需修改配置。
